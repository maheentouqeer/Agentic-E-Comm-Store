import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold">TechHub Store</div>
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Laptops, monitors and desk gear for individuals, studios and procurement teams.
          </p>
        </div>
        <div>
          <div className="eyebrow text-ink-muted">Shop</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>
              <Link to="/products" search={{ category: "laptop" }} className="hover:text-ink-foreground">
                Laptops
              </Link>
            </li>
            <li>
              <Link to="/products" search={{ category: "monitor" }} className="hover:text-ink-foreground">
                Monitors
              </Link>
            </li>
            <li>
              <Link to="/products" search={{ category: "accessory" }} className="hover:text-ink-foreground">
                Accessories
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="eyebrow text-ink-muted">Support</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>
              <Link to="/orders" className="hover:text-ink-foreground">
                Track an order
              </Link>
            </li>
            <li>
              <Link to="/bulk" className="hover:text-ink-foreground">
                Bulk enquiries
              </Link>
            </li>
            <li>30-day returns</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow text-ink-muted">Shipping zones</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>Local — 1-2 business days</li>
            <li>Regional — 3-5 business days</li>
            <li>International — 7-12 business days</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sidebar-border">
        <div className="container-page py-6 text-xs text-ink-muted">
          © {new Date().getFullYear()} TechHub Store. Demo storefront — no real payments are taken.
        </div>
      </div>
    </footer>
  );
}
