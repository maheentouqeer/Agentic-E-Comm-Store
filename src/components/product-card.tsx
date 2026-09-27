import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/data/products";
import { categoryImages } from "@/lib/product-images";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lift">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="block overflow-hidden bg-ink"
      >
        <img
          src={categoryImages[product.category]}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={768}
          className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{product.id}</span>
          {product.stock <= 5 ? (
            <Badge variant="destructive">Only {product.stock} left</Badge>
          ) : (
            <Badge variant="secondary">In stock</Badge>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold">
          <Link to="/products/$productId" params={{ productId: product.id }}>
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.category === "laptop"
            ? `${product.cpu} · ${product.ram_gb}GB · ${product.storage_gb}GB · ${product.gpu}`
            : product.use_case.replace(/\//g, " · ")}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3 pt-2">
          <div className="font-display text-2xl font-bold">{formatPrice(product.price_usd)}</div>
          <Button size="sm" onClick={() => add(product.id)}>
            Add to cart
          </Button>
        </div>
      </div>
    </article>
  );
}
