/**
 * Central API client connected to the Python FastAPI backend.
 */
import type {
  ChatMessage,
  ChatResponse,
  InventoryCheckResponse,
  InventoryLogEntry,
  MarketingRequest,
  MarketingResponse,
  OrderStatusResponse,
} from "@/types/agents";

export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:8000";

/** --- 1. Agentic RAG chatbot ------------------------------------------- */

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    throw new Error(`Chat request failed with status ${res.status}`);
  }
  return res.json();
}

/** --- 2. Marketing agent ---------------------------------------------- */

export async function generateMarketingContent(
  request: MarketingRequest,
): Promise<MarketingResponse> {
  const res = await fetch(`${API_BASE_URL}/marketing/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: request.product_id,
      content_type: request.content_type,
      tone: request.tone,
      count: request.count,
    }),
  });
  if (!res.ok) {
    throw new Error(`Marketing request failed with status ${res.status}`);
  }
  return res.json();
}

/** --- 3. Order status ------------------------------------------------- */

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`);
  if (!res.ok) {
    throw new Error(`Order status request failed with status ${res.status}`);
  }
  return res.json();
}

/** --- 4. Inventory / ops agent ---------------------------------------- */

export async function runInventoryCheck(): Promise<InventoryCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/simulate/inventory-check`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Inventory check failed with status ${res.status}`);
  }
  return res.json();
}

export async function getInventoryLogs(): Promise<InventoryLogEntry[]> {
  const res = await fetch(`${API_BASE_URL}/logs`);
  if (!res.ok) {
    throw new Error(`Fetching inventory logs failed with status ${res.status}`);
  }
  return res.json();
}
