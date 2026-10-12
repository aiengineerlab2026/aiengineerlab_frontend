/** Metric catalogue shared by the evaluation dashboard, comparison table and charts. */

export interface MetricDef {
  key: string;
  label: string;
  short: string;
  group: "retrieval" | "ragas" | "performance";
  description: string;
  lowerIsBetter?: boolean;
}

export const METRICS: MetricDef[] = [
  {
    key: "precision_at_5",
    label: "Precision@5",
    short: "P@5",
    group: "retrieval",
    description:
      "Dish-level: of the first 5 distinct dishes retrieved, the fraction that are in the ground-truth set.",
  },
  {
    key: "recall_at_5",
    label: "Recall@5",
    short: "R@5",
    group: "retrieval",
    description: "Dish-level: the fraction of ground-truth dishes found within the first 5 distinct dishes.",
  },
  {
    key: "precision_at_10",
    label: "Precision@10",
    short: "P@10",
    group: "retrieval",
    description: "Dish-level: of the first 10 distinct dishes retrieved, the fraction that are relevant.",
  },
  {
    key: "recall_at_10",
    label: "Recall@10",
    short: "R@10",
    group: "retrieval",
    description: "Dish-level: the fraction of ground-truth dishes found within the first 10 distinct dishes.",
  },
  {
    key: "non_llm_context_precision",
    label: "Context precision",
    short: "Ctx prec.",
    group: "ragas",
    description:
      "RAGAS, no LLM: of the chunks the LLM was given, the share that cover a relevant dish, weighted toward the top ranks. Chunk-level, by string match.",
  },
  {
    key: "non_llm_context_recall",
    label: "Context recall",
    short: "Ctx rec.",
    group: "ragas",
    description:
      "RAGAS, no LLM: of the chunks that cover the relevant dishes, the share that were actually given to the LLM. Chunk-level, by string match.",
  },
  {
    key: "faithfulness",
    label: "Faithfulness",
    short: "Faith.",
    group: "ragas",
    description:
      "RAGAS, LLM-based: the share of claims in the reply that the retrieved context supports. Low means the reply says things the context does not back up.",
  },
  {
    key: "answer_relevancy",
    label: "Answer relevancy",
    short: "Ans. rel.",
    group: "ragas",
    description:
      "RAGAS, LLM-based: how well the reply addresses the question (the LLM regenerates questions from the reply and compares them with the real one).",
  },
  {
    key: "llm_context_precision",
    label: "LLM context precision",
    short: "LLM prec.",
    group: "ragas",
    description:
      "RAGAS, LLM-based: an LLM judges whether each retrieved chunk is useful for answering the question, weighted toward the top ranks.",
  },
  {
    key: "llm_context_recall",
    label: "LLM context recall",
    short: "LLM rec.",
    group: "ragas",
    description:
      "RAGAS, LLM-based: an LLM checks whether the information in the judged-relevant dishes is covered by the retrieved context.",
  },
  {
    key: "avg_retrieval_latency_ms",
    label: "Avg retrieval latency",
    short: "Latency",
    group: "performance",
    description: "Mean retrieval time per question (excludes answer generation and RAGAS).",
    lowerIsBetter: true,
  },
  {
    key: "duration_seconds",
    label: "Run duration",
    short: "Duration",
    group: "performance",
    description: "Wall-clock time of the whole evaluation run.",
    lowerIsBetter: true,
  },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m]));
export const RETRIEVAL_METRICS = METRICS.filter((m) => m.group === "retrieval");
export const RAGAS_METRICS = METRICS.filter((m) => m.group === "ragas");

/** Below this a per-question metric is flagged as "poor" in the query inspector. */
export const POOR_THRESHOLD = 0.5;

/** Reads a metric from a run; run duration lives on the run itself rather than in `metrics`. */
export function runMetric(
  run: { metrics: Record<string, number | null>; duration_seconds: number | null },
  key: string,
): number | null {
  const v = run.metrics[key];
  if (v !== undefined && v !== null) return v;
  return key === "duration_seconds" ? run.duration_seconds : null;
}

export function formatMetric(key: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/a";
  if (key === "avg_retrieval_latency_ms") return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
  if (key === "duration_seconds") return value >= 60 ? `${Math.floor(value / 60)}m ${Math.round(value % 60)}s` : `${value.toFixed(1)}s`;
  return value.toFixed(3);
}
