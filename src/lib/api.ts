/**
 * Central API client.
 *
 * Every function below is currently MOCKED with a ~500ms delay. When the real
 * agent backend is ready, swap each function body for a fetch against
 * API_BASE_URL — no component changes required.
 */
import { products, getProduct, formatPrice } from "@/data/products";
import { getOrder } from "@/data/orders";
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

const MOCK_DELAY = 500;

function delay<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const SHIPPING_MULTIPLIER: Record<string, number> = {
  local: 1,
  regional: 1.06,
  international: 1.14,
};

/** --- 1. Agentic RAG chatbot ------------------------------------------- */

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const text = message.toLowerCase();
  void history;

  // Order status intent
  const orderMatch = message.match(/ORD-\d{3,4}/i);
  if (orderMatch || /order|delivery|shipment|track/.test(text)) {
    const id = orderMatch?.[0]?.toUpperCase() ?? "";
    const order = id ? getOrder(id) : undefined;
    if (order) {
      return delay({
        response: `Order ${order.order_id} for ${order.customer} is currently **${order.status}**. It contains ${order.item}${
          order.eta_days > 0 ? `, with an estimated ${order.eta_days} day(s) to arrival` : " and has already arrived"
        }.`,
        tools_used: ["order_lookup"],
        tool_result: { ...order },
        retrieved: ["policy: order-tracking", `order: ${order.order_id}`],
      });
    }
    return delay({
      response: id
        ? `I couldn't find order ${id} in our system. I've flagged this for a human agent to review — please double-check the ID on your confirmation email.`
        : "Happy to help with an order — could you share the order ID? It looks like ORD-1002.",
      tools_used: id ? ["order_lookup", "escalate_to_human"] : [],
      tool_result: id ? { found: false, escalated: true, order_id: id } : null,
      retrieved: ["policy: order-tracking"],
    });
  }

  // Bulk quote intent
  const qtyMatch = text.match(/(\d{2,4})\s*(units|pcs|pieces|x)?/);
  const skuMatch = message.match(/(LT|MN|AC)-\d{3}/i);
  if (/quote|bulk|units|wholesale|b2b/.test(text) && skuMatch) {
    const product = getProduct(skuMatch[0].toUpperCase());
    const qty = qtyMatch ? Number(qtyMatch[1]) : 10;
    if (product) {
      const destination = /international/.test(text)
        ? "international"
        : /regional/.test(text)
          ? "regional"
          : "local";
      const discount = qty >= 50 ? 0.12 : qty >= 25 ? 0.08 : qty >= 10 ? 0.04 : 0;
      const unit = product.price_usd * (1 - discount);
      const total = unit * qty * (SHIPPING_MULTIPLIER[destination] ?? 1);
      return delay({
        response: `For **${qty} units of ${product.name} (${product.id})** shipped ${destination}: unit price ${formatPrice(
          Math.round(unit),
        )} after a ${(discount * 100).toFixed(0)}% volume discount, total **${formatPrice(
          Math.round(total),
        )}** including ${destination} shipping. Current stock is ${product.stock} units, so larger orders ship in staged batches.`,
        tools_used: ["price_quote", "stock_check"],
        tool_result: {
          product_id: product.id,
          quantity: qty,
          destination,
          unit_price_usd: Math.round(unit),
          discount_pct: discount * 100,
          total_usd: Math.round(total),
        },
        retrieved: ["policy: bulk-pricing-tiers", "policy: shipping-zones", `product: ${product.id}`],
      });
    }
  }

  // Stock intent
  if (/stock|available|in stock|inventory/.test(text) && skuMatch) {
    const product = getProduct(skuMatch[0].toUpperCase());
    if (product) {
      return delay({
        response: `Yes — **${product.name} (${product.id})** is in stock with ${product.stock} unit(s) available at ${formatPrice(
          product.price_usd,
        )}. ${product.stock <= 5 ? "Stock is low, so I'd order soon." : "Orders placed today ship same day."}`,
        tools_used: ["stock_check"],
        tool_result: { product_id: product.id, stock: product.stock, price_usd: product.price_usd },
        retrieved: [`product: ${product.id}`, "policy: same-day-dispatch"],
      });
    }
  }

  // Recommendation intent (RAG over the catalog)
  const budget = text.match(/\$?\s?(\d{3,5})/);
  const max = budget ? Number(budget[1]) : undefined;
  const wantsCreative = /video editing|creative|render|gaming|3d/.test(text);
  const wantsLight = /travel|light|portable|student|everyday|office/.test(text);
  let matches = products.filter((p) => p.category === "laptop");
  if (max) matches = matches.filter((p) => p.price_usd <= max);
  if (wantsCreative) matches = matches.filter((p) => /gaming|creative/.test(p.use_case));
  if (wantsLight && !wantsCreative) matches = matches.filter((p) => /travel|office|everyday/.test(p.use_case));
  matches = matches.sort((a, b) => b.price_usd - a.price_usd).slice(0, 2);

  if (matches.length) {
    const lines = matches
      .map(
        (p) =>
          `- **${p.name} (${p.id})** — ${p.cpu}, ${p.ram_gb}GB RAM, ${p.storage_gb}GB SSD, ${p.gpu} — ${formatPrice(
            p.price_usd,
          )} (${p.stock} in stock)`,
      )
      .join("\n");
    return delay({
      response: `Based on the catalog${max ? ` and a ${formatPrice(max)} budget` : ""}, here's what I'd recommend:\n\n${lines}\n\nWant a side-by-side comparison or a bulk quote for either of these?`,
      tools_used: ["catalog_search"],
      tool_result: { matches: matches.map((p) => p.id) },
      retrieved: [
        ...matches.map((p) => `product: ${p.id}`),
        "policy: returns-30-day",
        "guide: choosing-a-laptop-by-workload",
      ],
    });
  }

  return delay({
    response:
      "I can help with product recommendations, live stock levels, bulk quotes and order tracking. Try telling me your budget and what you'll use the machine for — for example \"I need a laptop for video editing under $900\".",
    tools_used: [],
    tool_result: null,
    retrieved: ["policy: support-scope"],
  });
}

/** --- 2. Marketing agent ---------------------------------------------- */

const CONTENT_LABELS: Record<MarketingRequest["content_type"], string> = {
  ad_copy: "Ad Copy",
  product_description: "Product Description",
  social_caption: "Social Caption",
  email_subject: "Email Subject",
};

export async function generateMarketingContent(
  request: MarketingRequest,
): Promise<MarketingResponse> {
  const product = getProduct(request.product_id);
  const name = product?.name ?? request.product_id;
  const price = product ? formatPrice(product.price_usd) : "";
  const tone = request.tone.trim() || "confident";
  const count = Math.max(1, Math.min(request.count || 3, 5));

  const banks: Record<MarketingRequest["content_type"], string[]> = {
    ad_copy: [
      `${name} — serious performance from ${price}. Built for people who ship work, not excuses. Free local delivery.`,
      `Upgrade day starts here. The ${name} pairs ${product?.cpu ?? "modern silicon"} with ${product?.ram_gb ?? 16}GB RAM so nothing stalls mid-render. From ${price}.`,
      `Why wait for a sale? ${name} is in stock today at ${price}, with 30-day returns and bulk pricing for teams.`,
      `Stop babysitting a slow machine. ${name}. ${price}. In stock.`,
    ],
    product_description: [
      `The ${name} is a ${product?.use_case ?? "versatile"} workhorse: ${product?.cpu ?? "a fast CPU"}, ${product?.ram_gb ?? 16}GB of memory and ${product?.storage_gb ?? 512}GB of NVMe storage in a chassis that travels well. A ${tone} pick for daily driving.`,
      `Engineered for balance. ${name} delivers ${product?.gpu ?? "reliable"} graphics and all-day responsiveness, so heavy tabs, timelines and spreadsheets stay smooth. Ships with a two-year warranty.`,
      `Everything you need, nothing you don't. ${name} keeps the specs that matter — memory, storage and thermals — and skips the markup. ${price}.`,
    ],
    social_caption: [
      `New arrival: ${name}. ${tone.charAt(0).toUpperCase() + tone.slice(1)}, fast and finally in stock. 🔗 in bio`,
      `POV: your render finishes before your coffee cools. ${name}, ${price}. ✨`,
      `Small desk. Big output. Meet the ${name}. #TechHubStore`,
    ],
    email_subject: [
      `${name} is back in stock — from ${price}`,
      `Your next machine, sorted: ${name}`,
      `Team upgrade? Bulk pricing on ${name} inside`,
    ],
  };

  const bank = banks[request.content_type];
  return delay({
    product: name,
    content_type: CONTENT_LABELS[request.content_type],
    variations: bank.slice(0, count),
  });
}

/** --- 3. Order status ------------------------------------------------- */

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const order = getOrder(orderId);
  if (!order) {
    return delay({
      found: false,
      escalated: true,
      order_id: orderId.trim().toUpperCase(),
    });
  }
  return delay({
    found: true,
    escalated: false,
    order_id: order.order_id,
    customer: order.customer,
    item: order.item,
    status: order.status,
    eta_days: order.eta_days,
  });
}

/** --- 4. Inventory / ops agent ---------------------------------------- */

const LOW_STOCK_THRESHOLD = 6;

let inventoryLogs: InventoryLogEntry[] = [];

export async function runInventoryCheck(): Promise<InventoryCheckResponse> {
  const actions: InventoryLogEntry[] = [];

  for (const product of products) {
    if (product.stock <= LOW_STOCK_THRESHOLD) {
      const reorderQty = product.category === "laptop" ? 20 : 40;
      const supplier = product.category === "laptop" ? "Northbridge Components" : "Orbit Peripherals";
      actions.push({
        sku: product.id,
        product: product.name,
        action: "low_stock_detected",
        message: `Stock for ${product.name} is at ${product.stock}, below the threshold of ${LOW_STOCK_THRESHOLD}.`,
        stock_before: product.stock,
        threshold: LOW_STOCK_THRESHOLD,
      });
      actions.push({
        sku: product.id,
        product: product.name,
        action: "reorder_drafted",
        message: `Drafted purchase order to ${supplier} for ${reorderQty} units of ${product.id}, requesting expedited freight.`,
        reorder_qty: reorderQty,
        supplier,
      });
      actions.push({
        sku: product.id,
        product: product.name,
        action: "restock_confirmed",
        message: `${supplier} confirmed ${reorderQty} units; inventory projection updated.`,
        supplier,
        qty_received: reorderQty,
        stock_after: product.stock + reorderQty,
      });
    }
  }

  if (!actions.length) {
    actions.push({
      sku: "-",
      product: "All products",
      action: "no_action_needed",
      message: `Every SKU is above the reorder threshold of ${LOW_STOCK_THRESHOLD} units.`,
    });
  }

  inventoryLogs = [...actions, ...inventoryLogs].slice(0, 60);
  return delay({ actions_taken: actions, count: actions.length });
}

export async function getInventoryLogs(): Promise<InventoryLogEntry[]> {
  return delay([...inventoryLogs]);
}
