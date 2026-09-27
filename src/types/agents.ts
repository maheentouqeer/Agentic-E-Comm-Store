export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  tools_used: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool_result: Record<string, any> | null;
  retrieved: string[];
}

export type MarketingContentType =
  | "ad_copy"
  | "product_description"
  | "social_caption"
  | "email_subject";

export interface MarketingRequest {
  product_id: string;
  content_type: MarketingContentType;
  tone: string;
  count: number;
}

export interface MarketingResponse {
  product: string;
  content_type: string;
  variations: string[];
}

export interface OrderStatusResponse {
  found: boolean;
  escalated: boolean;
  order_id: string;
  customer?: string;
  item?: string;
  status?: string;
  eta_days?: number;
}

export interface InventoryLogEntry {
  sku: string;
  product: string;
  action: string;
  message?: string;
  stock_before?: number;
  threshold?: number;
  reorder_qty?: number;
  supplier?: string;
  qty_received?: number;
  stock_after?: number;
}

export interface InventoryCheckResponse {
  actions_taken: InventoryLogEntry[];
  count: number;
}

/** Chat assistant message enriched with the agent trace from its response. */
export interface ChatTurn extends ChatMessage {
  tools_used?: string[];
  retrieved?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool_result?: Record<string, any> | null;
}
