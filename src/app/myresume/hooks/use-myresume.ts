"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { myresume } from "@/app/myresume/lib/endpoints";
import { useSettings } from "@/app/myresume/stores/settings-store";

export const keys = {
  jobs: ["myresume", "jobs"] as const,
  defaults: ["myresume", "defaults"] as const,
  models: ["myresume", "models"] as const,
  uploadUsage: ["myresume", "upload-usage"] as const,
  vectorUsage: ["myresume", "vector-usage"] as const,
};

/** The job postings that are searched. Loaded only when asked for (`enabled`), e.g. when the data list is opened. */
export function useJobs(enabled: boolean) {
  return useQuery({ queryKey: keys.jobs, queryFn: myresume.jobs, staleTime: Infinity, enabled });
}

export function useDefaults() {
  return useQuery({ queryKey: keys.defaults, queryFn: myresume.defaults, staleTime: Infinity });
}

/** The embedding models that can be chosen (Gemini, Cloudflare) and their quota state. */
export function useModels() {
  return useQuery({ queryKey: keys.models, queryFn: myresume.models, refetchInterval: 30_000 });
}

/** Loads the settings saved in this browser once, after hydration. */
export function useRestoreSettings() {
  useEffect(() => {
    void useSettings.persist.rehydrate();
  }, []);
}

/**
 * The embedding model this browser chose, as it should be sent with a request: a saved choice that the server no longer
 * offers is dropped (null = let the server use its default), so a stale value can never make requests fail.
 */
export function useChosenEmbedding() {
  const models = useModels().data;
  const embedding = useSettings((s) => s.embedding);
  return {
    embedding: offered(models?.embedding, embedding),
    catalog: models,
  };
}

const offered = (list: { provider: string; model: string }[] | undefined, m: { provider: string; model: string } | null) =>
  m && list?.some((o) => o.provider === m.provider && o.model === m.model) ? m : null;

/** Resumes this client IP may still upload. */
export function useUploadUsage() {
  return useQuery({ queryKey: keys.uploadUsage, queryFn: myresume.uploadUsage, staleTime: 30_000 });
}

/** Vector searches this client IP may still run. */
export function useVectorUsage() {
  return useQuery({ queryKey: keys.vectorUsage, queryFn: myresume.vectorUsage, staleTime: 30_000 });
}
