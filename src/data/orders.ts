export interface Order {
  order_id: string;
  customer: string;
  item: string;
  status: "processing" | "shipped" | "delivered";
  eta_days: number;
}

export const orders: Order[] = [
  {
    order_id: "ORD-1001",
    customer: "Dana Whitfield",
    item: "ProBook X5 (LT-002) x1",
    status: "shipped",
    eta_days: 2,
  },
  {
    order_id: "ORD-1002",
    customer: "Marcus Lee",
    item: "ProBook X7 Creator (LT-003) x1",
    status: "processing",
    eta_days: 5,
  },
  {
    order_id: "ORD-1003",
    customer: "Priya Raman",
    item: 'ViewMax 24" Monitor (MN-001) x2',
    status: "delivered",
    eta_days: 0,
  },
];

export function getOrder(orderId: string): Order | undefined {
  return orders.find((o) => o.order_id.toLowerCase() === orderId.trim().toLowerCase());
}
