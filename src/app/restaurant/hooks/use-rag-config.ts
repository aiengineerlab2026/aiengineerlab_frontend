"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { rag } from "@/app/restaurant/lib/endpoints";
import { useEmbeddingChoiceStore } from "@/app/restaurant/stores/embedding-choice";
import { keys } from "./use-restaurant";

export function useStrategies() {
  return useQuery({ queryKey: keys.strategies, queryFn: rag.strategies, staleTime: 5 * 60_000 });
}

/** The models that can be chosen (per provider) and the current choice. */
export function useModels() {
  return useQuery({ queryKey: keys.models, queryFn: rag.models, refetchInterval: 30_000 });
}

/** The live RAG configuration (there is exactly one). */
export function useRagConfig() {
  return useQuery({ queryKey: keys.config, queryFn: rag.config });
}

/** State of the live configuration's index, polled while it is being built. */
export function useIndexStatus(fingerprint?: string) {
  return useQuery({
    queryKey: [...keys.indexStatus, fingerprint ?? ""],
    queryFn: rag.indexStatus,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "pending" || status === "building" ? 1500 : false;
    },
    retry: false,
  });
}

/**
 * The embedding model this visitor searches with: their saved pick when it is still offered, otherwise the app
 * default. `chosen` is what to send with a request (undefined = let the server use its default).
 */
export function useEmbeddingChoice() {
  const models = useModels();
  const stored = useEmbeddingChoiceStore((s) => s.embedding);
  const setEmbedding = useEmbeddingChoiceStore((s) => s.setEmbedding);
  useEffect(() => {
    void useEmbeddingChoiceStore.persist.rehydrate();
  }, []);
  const offered = models.data?.embedding.some((m) => m.provider === stored?.provider && m.model === stored?.model);
  const chosen = stored && offered ? stored : undefined;
  return { chosen, effective: chosen ?? models.data?.default_embedding, setEmbedding };
}
