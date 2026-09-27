import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/data/products";
import { categoryImages } from "@/lib/product-images";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — TechHub Store" },
      {
        name: "description",
        content: "Review the laptops, monitors and accessories in your TechHub Store cart before checkout.",
      },
      { property: "og:title", content: "Your cart — TechHub Store" },
      { property: "og:description", content: "Review your TechHub Store cart before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQty, remove } = useCart();

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Nothing here yet.</p>
          <Button asChild className="mt-4">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-5 p-5">
                <img
                  src={categoryImages[line.product.category]}
                  alt={line.product.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="size-24 shrink-0 rounded-md bg-ink object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/products/$productId"
                        params={{ productId: line.product.id }}
                        className="font-medium hover:underline"
                      >
                        {line.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {line.product.id} · {formatPrice(line.product.price_usd)} each
                      </p>
                    </div>
                    <button
                      onClick={() => remove(line.productId)}
                      aria-label={`Remove ${line.product.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        className="grid size-9 place-items-center text-muted-foreground hover:text-foreground"
                        onClick={() => setQty(line.productId, line.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-medium">{line.qty}</span>
                      <button
                        className="grid size-9 place-items-center text-muted-foreground hover:text-foreground"
                        onClick={() => setQty(line.productId, Math.min(line.qty + 1, line.product.stock))}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-display text-lg font-bold">{formatPrice(line.lineTotal)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-panel lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Shipping" value="Calculated at checkout" />
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated total</span>
              <span className="font-display text-2xl font-bold">{formatPrice(subtotal)}</span>
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
