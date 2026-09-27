import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { products } from "@/data/products";
import { generateMarketingContent, getInventoryLogs, runInventoryCheck } from "@/lib/api";
import type {
  InventoryLogEntry,
  MarketingContentType,
  MarketingResponse,
} from "@/types/agents";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Operations console — TechHub Store" },
      {
        name: "description",
        content:
          "Internal TechHub Store console: generate marketing copy variations and run autonomous inventory checks.",
      },
      { property: "og:title", content: "Operations console — TechHub Store" },
      {
        property: "og:description",
        content: "Marketing content generation and inventory operations for TechHub Store staff.",
      },
    ],
  }),
  component: Admin,
});

const CONTENT_TYPES: Array<{ value: MarketingContentType; label: string }> = [
  { value: "ad_copy", label: "Ad Copy" },
  { value: "product_description", label: "Description" },
  { value: "social_caption", label: "Social Caption" },
  { value: "email_subject", label: "Email Subject" },
];

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low_stock_detected: { label: "Low stock detected", variant: "destructive" },
  reorder_drafted: { label: "Reorder drafted", variant: "default" },
  restock_confirmed: { label: "Restock confirmed", variant: "secondary" },
  no_action_needed: { label: "No action needed", variant: "secondary" },
};

function Admin() {
  return (
    <div className="container-page py-12">
      <span className="eyebrow">Internal</span>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Operations console</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Marketing content generation and autonomous inventory operations.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <MarketingPanel />
        <InventoryPanel />
      </div>
    </div>
  );
}

function MarketingPanel() {
  const [productId, setProductId] = useState(products[0]!.id);
  const [contentType, setContentType] = useState<MarketingContentType>("ad_copy");
  const [tone, setTone] = useState("confident, benefit-led");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketingResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      setResult(await generateMarketingContent({ product_id: productId, content_type: contentType, tone, count: 3 }));
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-panel">
      <h2 className="font-display text-xl font-semibold">Marketing Content Generator</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a product and format, get three copy variations.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="mk-product">Product</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger id="mk-product">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="mk-type">Content type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as MarketingContentType)}>
              <SelectTrigger id="mk-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mk-tone">Tone</Label>
            <Input id="mk-tone" value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
        </div>

        <Button onClick={() => void generate()} disabled={loading} size="lg">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      )}

      {result && !loading && (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <span className="eyebrow">{result.content_type}</span>
            <span className="text-xs text-muted-foreground">· {result.product}</span>
          </div>
          <ul className="mt-3 space-y-3">
            {result.variations.map((variation, i) => (
              <li key={i} className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm leading-relaxed">{variation}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0 text-xs"
                  onClick={() => void copy(variation, i)}
                >
                  {copiedIndex === i ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copiedIndex === i ? "Copied" : "Copy"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function InventoryPanel() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<InventoryLogEntry[]>([]);
  const [lastRunCount, setLastRunCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLogs(await getInventoryLogs());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async () => {
    setRunning(true);
    try {
      const res = await runInventoryCheck();
      setLastRunCount(res.count);
      await refresh();
      toast.success(`Inventory agent completed ${res.count} action${res.count === 1 ? "" : "s"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-panel">
      <h2 className="font-display text-xl font-semibold">Inventory / Ops</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The agent scans stock levels, drafts supplier reorders and logs every action it takes.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => void run()} disabled={running} size="lg">
          {running ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {running ? "Running check…" : "Run Inventory Check"}
        </Button>
        {lastRunCount !== null && !running && (
          <span className="text-sm text-muted-foreground">{lastRunCount} actions last run</span>
        )}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Activity log</h3>
        <span className="text-xs text-muted-foreground">{logs.length} entries</span>
      </div>

      {logs.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No agent activity yet. Run a check to see what it decides to do.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {logs.map((entry, i) => {
            const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, variant: "secondary" as const };
            return (
              <li key={`${entry.sku}-${entry.action}-${i}`} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    {entry.product} <span className="text-muted-foreground">· {entry.sku}</span>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                {entry.message && (
                  <p className="mt-2 text-sm text-muted-foreground">{entry.message}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {entry.stock_before !== undefined && <span>stock before: {entry.stock_before}</span>}
                  {entry.threshold !== undefined && <span>threshold: {entry.threshold}</span>}
                  {entry.reorder_qty !== undefined && <span>reorder qty: {entry.reorder_qty}</span>}
                  {entry.supplier && <span>supplier: {entry.supplier}</span>}
                  {entry.qty_received !== undefined && <span>received: {entry.qty_received}</span>}
                  {entry.stock_after !== undefined && <span>stock after: {entry.stock_after}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
