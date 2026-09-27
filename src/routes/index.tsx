import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Boxes, Truck } from "lucide-react";
import heroImg from "@/assets/hero-laptop.jpg";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { categoryImages } from "@/lib/product-images";
import { categoryLabels, products, type ProductCategory } from "@/data/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechHub Store — Laptops, Monitors & Accessories" },
      {
        name: "description",
        content:
          "Shop laptops, monitors and desk accessories at TechHub Store. Retail and bulk B2B pricing, fast dispatch and an AI assistant for quotes and order tracking.",
      },
      { property: "og:title", content: "TechHub Store — Laptops, Monitors & Accessories" },
      {
        property: "og:description",
        content: "Retail and bulk pricing on laptops, monitors and accessories, with same-day dispatch.",
      },
    ],
  }),
  component: Home,
});

const CATEGORIES: ProductCategory[] = ["laptop", "monitor", "accessory"];

function Home() {
  const featured = products.filter((p) => ["LT-003", "LT-005", "LT-001", "MN-001"].includes(p.id));

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img
          src={heroImg}
          alt="Laptop on a dark studio backdrop"
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-transparent" />
        <div className="container-page relative grid gap-8 py-24 lg:py-32">
          <div className="max-w-xl">
            <span className="eyebrow text-primary">New 13th-gen line-up</span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Hardware that keeps up with the work.
            </h1>
            <p className="mt-5 max-w-lg text-base text-ink-muted sm:text-lg">
              Laptops, monitors and desk gear picked for real workloads — from student notebooks to
              RTX-class studio machines. Retail or bulk, same catalogue, same-day dispatch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/products">
                  Shop all products <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-ink-muted/40 bg-transparent text-ink-foreground hover:bg-sidebar-accent hover:text-ink-foreground">
                <Link to="/bulk">Request bulk pricing</Link>
              </Button>
            </div>
          </div>
          <dl className="mt-6 grid max-w-2xl gap-6 border-t border-sidebar-border pt-8 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Local dispatch", value: "1-2 business days" },
              { icon: Boxes, label: "Bulk tiers", value: "From 10 units" },
              { icon: BadgeCheck, label: "Returns", value: "30-day, no questions" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 text-primary" />
                <div>
                  <dt className="text-xs uppercase tracking-widest text-ink-muted">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to="/products"
              search={{ category }}
              className="group relative overflow-hidden rounded-xl border border-border bg-ink"
            >
              <img
                src={categoryImages[category]}
                alt={categoryLabels[category]}
                loading="lazy"
                width={1024}
                height={768}
                className="aspect-16/9 w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                <span className="font-display text-lg font-semibold text-ink-foreground">
                  {categoryLabels[category]}
                </span>
                <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Featured</span>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Popular right now</h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/products">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-card p-8 shadow-panel lg:grid-cols-[1.4fr_1fr] lg:p-12">
          <div>
            <span className="eyebrow">For teams</span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Kitting out an office? Get tiered pricing.
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Volume discounts start at 10 units and scale to 12% off at 50+, with local, regional and
              international freight options quoted up front.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Button asChild size="lg">
              <Link to="/bulk">Start a bulk enquiry</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
