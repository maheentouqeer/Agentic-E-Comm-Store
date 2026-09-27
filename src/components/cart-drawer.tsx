import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/data/products";
import { categoryImages } from "@/lib/product-images";
import { useCart } from "@/lib/cart";

export function CartDrawer() {
  const { lines, subtotal, setQty, remove, drawerOpen, setDrawerOpen } = useCart();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="font-display">Your cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Button asChild variant="outline" className="mt-4" onClick={() => setDrawerOpen(false)}>
                <Link to="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-5">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-4">
                  <img
                    src={categoryImages[line.product.category]}
                    alt={line.product.name}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="size-20 shrink-0 rounded-md bg-ink object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">{line.product.id}</p>
                      </div>
                      <button
                        onClick={() => remove(line.productId)}
                        aria-label={`Remove ${line.product.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-md border border-border">
                        <button
                          className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                          onClick={() => setQty(line.productId, line.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{line.qty}</span>
                        <button
                          className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                          onClick={() => setQty(line.productId, Math.min(line.qty + 1, line.product.stock))}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-medium">{formatPrice(line.lineTotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border p-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-display text-xl font-bold text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-2">
              <Button asChild size="lg" onClick={() => setDrawerOpen(false)}>
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="ghost" onClick={() => setDrawerOpen(false)}>
                <Link to="/cart">View full cart</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
