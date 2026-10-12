import { z } from "zod";
import type { ChunkingConfig, RagConfig, RetrievalConfig } from "@/app/restaurant/types/api";

/** Client-side validation mirrors backend/app/domain/rag/value_objects.py bounds. */
export const configFormSchema = z
  .object({
    chunking: z.object({
      strategy: z.enum(["fixed", "recursive", "semantic", "entity"]),
      chunk_size: z.number("Enter a number").int().min(50, "Min 50").max(4000, "Max 4000"),
      chunk_overlap: z.number("Enter a number").int().min(0, "Min 0").max(1000, "Max 1000"),
      length_unit: z.enum(["characters", "tokens"]),
      breakpoint_threshold_type: z.enum(["percentile", "standard_deviation", "interquartile", "gradient"]),
      breakpoint_threshold_amount: z.number("Enter a number").min(0, "Min 0").max(100, "Max 100"),
    }),
    retrieval: z.object({
      strategy: z.enum(["vector", "multi_query", "multi_query_rerank", "hybrid_rrf"]),
      top_k: z.number("Enter a number").int().min(1).max(20),
      num_query_variants: z.number("Enter a number").int().min(1).max(8),
      candidate_count: z.number("Enter a number").int().min(1).max(100),
      rerank_enabled: z.boolean(),
      reranker_model: z.string().min(1),
      rrf_k: z.number("Enter a number").int().min(1, "Min 1").max(1000, "Max 1000"),
    }),
  })
  .superRefine((v, ctx) => {
    const { strategy, chunk_size, chunk_overlap } = v.chunking;
    if ((strategy === "fixed" || strategy === "recursive") && chunk_overlap >= chunk_size) {
      ctx.addIssue({
        code: "custom",
        path: ["chunking", "chunk_overlap"],
        message: "Overlap must be smaller than the chunk size",
      });
    }
  });

export type ConfigFormValues = z.infer<typeof configFormSchema>;

export function toFormValues(cfg: Pick<RagConfig, "chunking" | "retrieval">): ConfigFormValues {
  const c = cfg.chunking;
  const r = cfg.retrieval;
  return {
    chunking: {
      strategy: c.strategy,
      chunk_size: c.chunk_size,
      chunk_overlap: c.chunk_overlap,
      length_unit: c.length_unit,
      breakpoint_threshold_type: c.breakpoint_threshold_type,
      breakpoint_threshold_amount: c.breakpoint_threshold_amount,
    },
    retrieval: {
      strategy: r.strategy,
      top_k: r.top_k,
      num_query_variants: r.num_query_variants,
      candidate_count: r.candidate_count,
      rerank_enabled: r.rerank_enabled,
      reranker_model: r.reranker_model,
      rrf_k: r.rrf_k,
    },
  };
}

export function toConfigs(
  values: ConfigFormValues,
  base: { chunking: ChunkingConfig },
): { chunking: ChunkingConfig; retrieval: RetrievalConfig } {
  return {
    // Chunking is not configurable in the UI: always entity based (one chunk per dish).
    chunking: { ...values.chunking, strategy: "entity", separators: base.chunking.separators },
    retrieval: { ...values.retrieval, candidate_count: Math.max(values.retrieval.candidate_count, values.retrieval.top_k) },
  };
}
