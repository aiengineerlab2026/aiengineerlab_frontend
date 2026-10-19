"use client";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { countryMatcher, type Choice, type QueryImage } from "@/app/country-matcher/lib/endpoints";
import type { Aggregation } from "@/app/country-matcher/types/api";

export const keys = {
  models: ["country-matcher", "models"] as const,
  examples: ["country-matcher", "examples"] as const,
  evaluation: ["country-matcher", "evaluation"] as const,
};

/** The models, their index sizes and the dataset size. */
export function useModels() {
  return useQuery({ queryKey: keys.models, queryFn: countryMatcher.models, staleTime: 60_000 });
}

/** Held-out images to try. Their signed URLs expire (default after an hour), so they are refreshed well before that. */
export function useExamples(enabled: boolean) {
  return useQuery({
    queryKey: keys.examples,
    queryFn: countryMatcher.examples,
    enabled,
    staleTime: 20 * 60_000,
    refetchInterval: 20 * 60_000,
  });
}

/** The indexed images, fetched only once the visitor asks to see them. Signed URLs expire, so the pages go stale after 20 minutes. */
export function useIndexedImages(enabled: boolean, country: string | null) {
  return useInfiniteQuery({
    queryKey: ["country-matcher", "indexed-images", country] as const,
    queryFn: ({ pageParam }) => countryMatcher.indexedImages(country, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + last.images.length < last.total ? last.offset + last.images.length : undefined),
    enabled,
    staleTime: 20 * 60_000,
  });
}

/**
 * The evaluation is empty until the first analysis finishes, then fetched again after every analysis (``runs`` is part of
 * the key and nothing is cached), so each Analyze shows a fresh evaluation load.
 */
export function useEvaluation(runs: number) {
  return useQuery({
    queryKey: [...keys.evaluation, runs] as const,
    queryFn: countryMatcher.evaluation,
    enabled: runs > 0,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useAnalyze() {
  return useMutation({
    mutationFn: (v: { image: QueryImage; choice: Choice; k: number; aggregation: Aggregation }) =>
      countryMatcher.analyze(v.image, v.choice, v.k, v.aggregation),
  });
}
