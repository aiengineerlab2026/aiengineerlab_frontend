import type { Method } from "@/app/myresume/types/api";

export const METHOD_LABEL: Record<Method, string> = {
  bm25: "BM25",
  vector: "Vector",
  hybrid: "Hybrid",
};

/** One colour per method, used by every chart and badge so a method looks the same everywhere. */
export const METHOD_COLOR: Record<Method, string> = {
  bm25: "#f59e0b",
  vector: "#6366f1",
  hybrid: "#10b981",
};

export const METHODS: Method[] = ["bm25", "vector", "hybrid"];

/** How a method's percentage is derived, shown next to the numbers. */
export const PERCENT_NOTE: Record<Method, string> = {
  bm25: "BM25 has no fixed scale, so the percentage is relative to the best-scoring job.",
  vector: "Cosine similarity between the resume and the job, as a percentage.",
  hybrid: "The fused RRF scores are min-max normalised over the returned jobs: the best is 100%, the last returned is 0%.",
};
