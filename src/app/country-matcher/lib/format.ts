import type { ModelEvaluation, ModelId } from "@/app/country-matcher/types/api";

export const MODEL_LABEL: Record<ModelId, string> = { clip: "CLIP", resnet50: "ResNet50" };
export const MODEL_COLOR: Record<ModelId, string> = { clip: "#2563eb", resnet50: "#ea580c" };

export const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`;
export const ms = (v: number) => (v >= 100 ? `${Math.round(v)} ms` : `${v.toFixed(1)} ms`);

export function bytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${Math.round(n)} B`;
}

/** 🇩🇪 from "DE": two regional indicator symbols. Falls back to nothing for anything that is not a 2-letter code. */
export function flag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export interface MetricRow {
  key: string;
  label: string;
  group: "Retrieval";
  /** Which direction is better, or null for a fact that is neither (the dimension). */
  better: "higher" | "lower" | null;
  /** The measured value for a model, or null when it was not defined. */
  value: (m: ModelEvaluation) => number | null;
  format: (v: number) => string;
  /** Marks the headline metric. */
  primary?: boolean;
}

export function metricRows(k: number): MetricRow[] {
  const r = (key: string) => (m: ModelEvaluation) => (m.retrieval[`${key}@${k}`] as number | null | undefined) ?? null;
  const row = (key: string, label: string, name: string): MetricRow => ({ key, label: `${label}@${k}`, group: "Retrieval", better: "higher", value: r(name), format: (v) => v.toFixed(3) });
  return [row("p", "Precision", "precision"), row("r", "Recall", "recall"), row("ndcg", "NDCG", "ndcg"), row("mrr", "MRR", "mrr")];
}

export type Winner = ModelId | "tie" | null;

/** Which model measured better on a row. Decided only from the stored numbers, never assumed. */
export function winner(row: MetricRow, a: number | null, b: number | null): Winner {
  if (row.better === null || a === null || b === null) return null;
  const eps = 1e-9;
  if (Math.abs(a - b) <= eps) return "tie";
  const aWins = row.better === "higher" ? a > b : a < b;
  return aWins ? "clip" : "resnet50";
}
