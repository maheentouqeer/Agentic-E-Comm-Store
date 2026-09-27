import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Loader2, PackageCheck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrderStatus } from "@/lib/api";
import type { OrderStatusResponse } from "@/types/agents";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Track your order — TechHub Store" },
      {
        name: "description",
        content: "Enter your TechHub Store order ID to see live status, contents and estimated arrival.",
      },
      { property: "og:title", content: "Track your order — TechHub Store" },
      { property: "og:description", content: "Look up any TechHub Store order by its ID." },
    ],
  }),
  component: OrderLookup,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  processing: "secondary",
  shipped: "default",
  delivered: "default",
};

function OrderLookup() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderStatusResponse | null>(null);

  const lookup = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await getOrderStatus(id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <span className="eyebrow">Support</span>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Track your order</h1>
        <p className="mt-3 text-muted-foreground">
          Enter the order ID from your confirmation email — it looks like ORD-1002.
        </p>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(orderId);
          }}
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="ORD-1002"
            />
          </div>
          <Button type="submit" size="lg" disabled={loading || !orderId.trim()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Check status
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {["ORD-1001", "ORD-1002", "ORD-1003"].map((id) => (
            <button
              key={id}
              onClick={() => {
                setOrderId(id);
                void lookup(id);
              }}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              Try {id}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Looking up your order…
          </div>
        )}

        {result && !loading && (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-panel">
            {result.found ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="size-5 text-success" />
                    <span className="font-display text-xl font-bold">{result.order_id}</span>
                  </div>
                  <Badge variant={STATUS_VARIANT[result.status ?? "processing"] ?? "secondary"}>
                    {result.status}
                  </Badge>
                </div>
                <dl className="mt-6 divide-y divide-border text-sm">
                  <Row label="Customer" value={result.customer ?? "—"} />
                  <Row label="Items" value={result.item ?? "—"} />
                  <Row
                    label="Estimated arrival"
                    value={
                      result.eta_days && result.eta_days > 0
                        ? `${result.eta_days} business day${result.eta_days === 1 ? "" : "s"}`
                        : "Delivered"
                    }
                  />
                </dl>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 text-destructive" />
                <div>
                  <p className="font-medium">We couldn't find {result.order_id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This lookup has been escalated to a human agent. Double-check the ID on your
                    confirmation email, or ask the AI Assistant for help.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}
