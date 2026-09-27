import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { categoryLabels, formatPrice, products, useCaseTags } from "@/data/products";

interface ProductSearch {
  category?: string | undefined;
  maxPrice?: number | undefined;
  useCase?: string | undefined;
  sort?: "price-asc" | "price-desc" | undefined;
}

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    maxPrice: search["maxPrice"] != null ? Number(search["maxPrice"]) : undefined,
    useCase: typeof search["useCase"] === "string" ? search["useCase"] : undefined,
    sort: search["sort"] === "price-asc" || search["sort"] === "price-desc" ? search["sort"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All products — TechHub Store" },
      {
        name: "description",
        content:
          "Browse every TechHub Store laptop, monitor and accessory. Filter by category, price and use case, then sort by price.",
      },
      { property: "og:title", content: "All products — TechHub Store" },
      {
        property: "og:description",
        content: "Filter laptops, monitors and accessories by category, budget and workload.",
      },
    ],
  }),
  component: ProductListing,
});

const MAX_PRICE = 1500;

function ProductListing() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const update = (patch: Partial<ProductSearch>) => {
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const visible = useMemo(() => {
    let list = [...products];
    if (search.category) list = list.filter((p) => p.category === search.category);
    if (search.maxPrice) list = list.filter((p) => p.price_usd <= search.maxPrice!);
    if (search.useCase) list = list.filter((p) => p.use_case.includes(search.useCase!));
    if (search.sort === "price-asc") list.sort((a, b) => a.price_usd - b.price_usd);
    if (search.sort === "price-desc") list.sort((a, b) => b.price_usd - a.price_usd);
    return list;
  }, [search]);

  return (
    <div className="container-page py-12">
      <span className="eyebrow">Catalogue</span>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
        {search.category ? categoryLabels[search.category as keyof typeof categoryLabels] : "All products"}
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div>
            <Label className="eyebrow">Category</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip
                active={!search.category}
                onClick={() => update({ category: undefined })}
                label="All"
              />
              {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((key) => (
                <FilterChip
                  key={key}
                  active={search.category === key}
                  onClick={() => update({ category: key })}
                  label={categoryLabels[key]}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="eyebrow">Max price</Label>
            <div className="mt-4">
              <Slider
                value={[search.maxPrice ?? MAX_PRICE]}
                min={50}
                max={MAX_PRICE}
                step={10}
                onValueChange={([v]) => update({ maxPrice: v })}
              />
              <div className="mt-2 text-sm text-muted-foreground">
                Up to {formatPrice(search.maxPrice ?? MAX_PRICE)}
              </div>
            </div>
          </div>

          <div>
            <Label className="eyebrow">Use case</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip
                active={!search.useCase}
                onClick={() => update({ useCase: undefined })}
                label="Any"
              />
              {useCaseTags.map((tag) => (
                <FilterChip
                  key={tag}
                  active={search.useCase === tag}
                  onClick={() => update({ useCase: tag })}
                  label={tag}
                />
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            className="px-0"
            onClick={() =>
              void navigate({ search: {} as ProductSearch })
            }
          >
            Clear all filters
          </Button>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {visible.length} product{visible.length === 1 ? "" : "s"}
            </p>
            <Select
              value={search.sort ?? "featured"}
              onValueChange={(v) =>
                update({ sort: v === "featured" ? undefined : (v as ProductSearch["sort"]) })
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visible.length === 0 ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              No products match those filters yet — try widening the price range.
            </p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
