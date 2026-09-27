import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/data/products";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/api";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — TechHub Store" },
      {
        name: "description",
        content:
          "Guest checkout for TechHub Store: enter shipping details, choose a destination zone and place your order.",
      },
      { property: "og:title", content: "Checkout — TechHub Store" },
      { property: "og:description", content: "Fast guest checkout, no account required." },
    ],
  }),
  component: Checkout,
});

const SHIPPING: Record<string, { label: string; cost: number; eta: string }> = {
  local: { label: "Local", cost: 0, eta: "1-2 business days" },
  regional: { label: "Regional", cost: 24, eta: "3-5 business days" },
  international: { label: "International", cost: 68, eta: "7-12 business days" },
};

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [destination, setDestination] = useState("local");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", address: "" });

  const shipping = SHIPPING[destination]!;
  const total = subtotal + shipping.cost;

  const placeOrder = async () => {
    setPlacing(true);
    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemsText = lines.map((l) => `${l.product.name} x${l.qty}`).join(", ");
    await createOrder({
      order_id: id,
      customer: form.name || "Guest Customer",
      item: itemsText || "TechHub Order",
      status: "processing",
      eta_days: destination === "international" ? 7 : destination === "regional" ? 4 : 2,
    });

    setOrderId(id);
    clear();
    setPlacing(false);
  };

  if (orderId) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-panel">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-5 text-2xl font-bold">Order confirmed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""} — we've emailed your receipt.
            Shipping {shipping.label.toLowerCase()}, arriving in {shipping.eta}.
          </p>
          <div className="mt-6 rounded-lg bg-secondary px-5 py-4">
            <div className="eyebrow">Order ID</div>
            <div className="mt-1 font-display text-2xl font-bold">{orderId}</div>
          </div>
          <div className="mt-6 grid gap-2">
            <Button asChild>
              <Link to="/orders">Track this order</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add a product before checking out.</p>
        <Button asChild className="mt-6">
          <Link to="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const canSubmit = form.name.trim() && form.email.trim() && form.address.trim() && !placing;

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Guest checkout — no account needed. This demo store takes no real payment.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form
          className="space-y-6 rounded-xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) void placeOrder();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Alex Moreau"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="alex@company.com"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Shipping address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, city, postal code, country"
              rows={3}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="destination">Destination type</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger id="destination">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SHIPPING).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label} — {value.cost === 0 ? "free" : formatPrice(value.cost)} · {value.eta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {placing ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Placing order…
              </>
            ) : (
              `Place order · ${formatPrice(total)}`
            )}
          </Button>
        </form>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-panel lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {line.product.name} × {line.qty}
                </span>
                <span className="font-medium">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping ({shipping.label})</span>
              <span className="font-medium">
                {shipping.cost === 0 ? "Free" : formatPrice(shipping.cost)}
              </span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
