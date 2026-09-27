import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice, getProduct } from "@/data/products";
import { categoryImages } from "@/lib/product-images";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId.toUpperCase());
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.product.name ?? "Product";
    const description = loaderData
      ? `${loaderData.product.name} at ${formatPrice(loaderData.product.price_usd)} — ${loaderData.product.use_case.replace(/\//g, ", ")}. In stock at TechHub Store.`
      : "Product details at TechHub Store.";
    return {
      meta: [
        { title: `${name} — TechHub Store` },
        { name: "description", content: description },
        { property: "og:title", content: `${name} — TechHub Store` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const specs: Array<[string, string]> = [
    ["SKU", product.id],
    ["Category", product.category],
    ...(product.cpu ? ([["Processor", product.cpu]] as Array<[string, string]>) : []),
    ...(product.ram_gb ? ([["Memory", `${product.ram_gb} GB`]] as Array<[string, string]>) : []),
    ...(product.storage_gb
      ? ([["Storage", `${product.storage_gb} GB NVMe SSD`]] as Array<[string, string]>)
      : []),
    ...(product.gpu ? ([["Graphics", product.gpu]] as Array<[string, string]>) : []),
    ["Best for", product.use_case.replace(/\//g, ", ")],
  ];

  return (
    <div className="container-page py-10">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/products">
          <ArrowLeft className="size-4" /> Back to catalogue
        </Link>
      </Button>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-ink">
          <img
            src={categoryImages[product.category]}
            alt={product.name}
            width={1024}
            height={768}
            className="aspect-4/3 w-full object-cover"
          />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="eyebrow">{product.id}</span>
            {product.stock <= 5 ? (
              <Badge variant="destructive">Only {product.stock} left</Badge>
            ) : (
              <Badge variant="secondary">{product.stock} in stock</Badge>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">
            Built for {product.use_case.replace(/\//g, ", ")}.
          </p>
          <div className="mt-6 font-display text-4xl font-bold">{formatPrice(product.price_usd)}</div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <button
                className="grid size-11 place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                className="grid size-11 place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button size="lg" onClick={() => add(product.id, qty)}>
              Add to cart
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/bulk">Need 10+? Get a quote</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-primary" /> Same-day dispatch on local orders
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> 2-year warranty, 30-day returns
            </div>
          </div>

          <Separator className="my-8" />

          <h2 className="text-lg font-semibold">Specifications</h2>
          <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {specs.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="text-right font-medium capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
