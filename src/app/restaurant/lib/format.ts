import type { ConfigSnapshot } from "@/app/restaurant/types/api";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Prices are in US dollars ("$13.50"). */
export function money(amount: number, currency = "USD"): string {
  return currency === "USD" ? usd.format(amount) : `${amount.toFixed(2)} ${currency}`;
}

/** Metric values are 0..1 fractions or null (not applicable / not computed). */
export function score(value: number | null | undefined, digits = 3): string {
  return value === null || value === undefined || Number.isNaN(value) ? "n/a" : value.toFixed(digits);
}

export function ms(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

export function seconds(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  return value >= 60 ? `${Math.floor(value / 60)}m ${Math.round(value % 60)}s` : `${value.toFixed(1)}s`;
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** One-line description of a configuration, e.g. "Recursive 500/50 · Hybrid Rrf + rerank · top-5". */
export function configLabel(c: Partial<ConfigSnapshot> | null | undefined): string {
  const ch = c?.chunking;
  const r = c?.retrieval;
  if (!ch || !r) return "Unknown configuration";
  const sized = ch.strategy === "fixed" || ch.strategy === "recursive";
  const chunking = `${titleCase(ch.strategy)}${sized ? ` ${ch.chunk_size}/${ch.chunk_overlap}` : ""}`;
  const retrieval = `${titleCase(r.strategy)}${r.rerank_enabled && r.strategy !== "multi_query_rerank" ? " + rerank" : ""}`;
  return `${chunking} · ${retrieval} · top-${r.top_k}`;
}
