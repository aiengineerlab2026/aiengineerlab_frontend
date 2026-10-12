"use client";

import { useQuery } from "@tanstack/react-query";
import { evaluations } from "@/app/restaurant/lib/endpoints";
import { keys } from "./use-restaurant";

const isLiveActive = (s: { status: string }) => s.status === "pending" || s.status === "running";

/**
 * Real customer questions, scored automatically. Polled continuously: every 2 s while something is being
 * scored, otherwise every 4 s so new questions show up without a reload.
 */
export function useLiveEvaluations() {
  return useQuery({
    queryKey: keys.live,
    queryFn: () => evaluations.live(100),
    refetchInterval: (q) => (q.state.data?.items.some(isLiveActive) ? 2000 : 4000),
  });
}

/**
 * The scores of the questions asked from this browser. The questions and replies themselves come from
 * localStorage; only the scores are fetched, by message id, and polled while any of them is still being scored.
 */
export function useLiveScores(messageIds: string[]) {
  return useQuery({
    queryKey: ["live-scores", ...messageIds],
    queryFn: () => evaluations.lookupLive(messageIds),
    enabled: messageIds.length > 0,
    refetchInterval: (q) => (q.state.data?.some(isLiveActive) ? 2000 : 5000),
  });
}
