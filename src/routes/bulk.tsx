import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { products } from "@/data/products";

export const Route = createFileRoute("/bulk")({
  head: () => ({
    meta: [
      { title: "Bulk & B2B enquiries — TechHub Store" },
      {
        name: "description",
        content:
          "Request tiered bulk pricing from TechHub Store: volume discounts from 10 units with local, regional and international freight.",
      },
      { property: "og:title", content: "Bulk & B2B enquiries — TechHub Store" },
      {
        property: "og:description",
        content: "Volume discounts from 10 units, quoted with freight up front.",
      },
    ],
  }),
  component: BulkEnquiry,
});

const TIERS = [
  { range: "10-24 units", discount: "4% off" },
  { range: "25-49 units", discount: "8% off" },
  { range: "50+ units", discount: "12% off" },
];

function BulkEnquiry() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: "",
    email: "",
    productId: products[0]!.id,
    quantity: "25",
    destination: "local",
    notes: "",
  });

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-panel">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-5 text-2xl font-bold">Enquiry received</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks{form.company ? `, ${form.company}` : ""} — our B2B desk will send a formal quote for{" "}
            {form.quantity} × {form.productId} ({form.destination}) within one business day.
          </p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Submit another enquiry
            </Button>
            <Button asChild variant="ghost">
              <Link to="/products">Back to catalogue</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = form.company.trim() && form.email.trim() && Number(form.quantity) > 0 && !submitting;

  return (
    <div className="container-page py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        <div>
          <span className="eyebrow">Bulk / B2B</span>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Request volume pricing</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Tell us what you need and where it ships. We'll come back with unit pricing, freight and a
            staged delivery plan if stock needs topping up.
          </p>

          <form
            className="mt-8 space-y-6 rounded-xl border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) void submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="company">Company name</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Northwind Studios"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulk-email">Work email</Label>
                <Input
                  id="bulk-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="procurement@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="bulk-product">Product</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm({ ...form, productId: v })}
                >
                  <SelectTrigger id="bulk-product">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-destination">Destination</Label>
              <Select
                value={form.destination}
                onValueChange={(v) => setForm({ ...form, destination: v })}
              >
                <SelectTrigger id="bulk-destination">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Deployment timeline, imaging requirements, invoicing terms…"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Sending enquiry…
                </>
              ) : (
                "Submit enquiry"
              )}
            </Button>
          </form>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-panel lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Volume tiers</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {TIERS.map((tier) => (
              <li key={tier.range} className="flex justify-between py-3">
                <span className="text-muted-foreground">{tier.range}</span>
                <span className="font-medium">{tier.discount}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Freight is quoted per zone: local, regional or international. Larger orders than current
            stock ship in staged batches.
          </p>
        </aside>
      </div>
    </div>
  );
}
