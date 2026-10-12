"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { Progress } from "@/app/restaurant/components/ui/progress";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { useIndexStatus, useRagConfig, useStrategies } from "@/app/restaurant/hooks/use-rag-config";
import { keys } from "@/app/restaurant/hooks/use-restaurant";
import { errorMessage } from "@/app/restaurant/lib/client";
import { rag } from "@/app/restaurant/lib/endpoints";
import { dateTime } from "@/app/restaurant/lib/format";
import { configFormSchema, toConfigs, toFormValues, type ConfigFormValues } from "@/app/restaurant/lib/schemas";
import type { RagConfig, RagIndex, Strategies } from "@/app/restaurant/types/api";
import {
  CField,
  InactiveBanner,
  NumberControl,
  Pill,
  Section,
  SelectControl,
  SliderControl,
  SwitchControl,
} from "./config-ui";
import { InfoTip } from "./fields";
import { ModelsSection } from "./models-section";
import { RawDataButton } from "./raw-data-dialog";

/** Wait this long after the last edit before applying, so typing a number does not fire a request per key. */
const APPLY_DELAY_MS = 500;

const RETRIEVAL_FIELDS = [
  ["num_query_variants", "Query variants"],
  ["candidate_count", "Candidates per query"],
  ["rrf_k", "RRF k"],
  ["rerank_enabled", "Cross-encoder rerank"],
  ["reranker_model", "Reranker model"],
] as const;

export function ConfigurationTab() {
  const strategies = useStrategies();
  const config = useRagConfig();

  if (strategies.isLoading || config.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }
  if (strategies.error || config.error || !strategies.data || !config.data) {
    return (
      <Alert variant="destructive">
        <XCircle />
        <AlertTitle>Couldn&apos;t load the configuration</AlertTitle>
        <AlertDescription>{errorMessage(strategies.error ?? config.error)}</AlertDescription>
      </Alert>
    );
  }
  // No `key`: the form is created once and keeps the user's edits while saves come back from the server.
  return <ConfigForm config={config.data} strategies={strategies.data} />;
}

function ConfigForm({ config, strategies }: { config: RagConfig; strategies: Strategies }) {
  const qc = useQueryClient();
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: toFormValues(config),
    mode: "onChange",
  });
  const { control, formState } = form;
  const values = useWatch({ control }) as ConfigFormValues;

  const retrInfo = strategies.retrieval.find((s) => s.id === values.retrieval?.strategy);
  const retrUses = useMemo(() => new Set(retrInfo?.uses ?? []), [retrInfo]);
  const llmReady = strategies.llm.configured;
  const rerankLocked = values.retrieval?.strategy === "multi_query_rerank";
  const rerankOn = rerankLocked || (retrUses.has("rerank_enabled") && !!values.retrieval?.rerank_enabled);

  // ---- live apply: every valid edit is sent automatically, in order, shortly after the last keystroke.
  const save = useMutation({
    mutationFn: rag.updateConfig,
    onSuccess: (saved) => {
      qc.setQueryData<RagConfig>(keys.config, saved);
      qc.invalidateQueries({ queryKey: keys.indexStatus });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const payload = formState.isValid && values.chunking && values.retrieval ? toConfigs(values, config) : null;
  const payloadKey = payload ? JSON.stringify(payload) : null;
  const [sentKey, setSentKey] = useState(() => JSON.stringify(toConfigs(toFormValues(config), config)));
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const { mutateAsync } = save;

  useEffect(() => {
    if (!payloadKey || payloadKey === sentKey) return;
    const timer = setTimeout(() => {
      setSentKey(payloadKey);
      queue.current = queue.current.then(() => mutateAsync(JSON.parse(payloadKey)).catch(() => undefined));
    }, APPLY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [payloadKey, sentKey, mutateAsync]);

  const invalid = !formState.isValid;
  const waiting = payloadKey !== null && payloadKey !== sentKey;
  const applying = waiting || save.isPending;
  const failed = save.isError && !applying;

  const retrInactive = RETRIEVAL_FIELDS.filter(([k]) => !retrUses.has(k)).map(([, label]) => label);

  const status = invalid ? (
    <Pill tone="warning">
      <AlertTriangle /> Fix highlighted fields
    </Pill>
  ) : failed ? (
    <Pill tone="danger">
      <XCircle /> Not applied
    </Pill>
  ) : applying ? (
    <Pill tone="info">
      <Loader2 className="animate-spin" /> Applying…
    </Pill>
  ) : (
    <Pill tone="success">
      <CheckCircle2 /> Applied
    </Pill>
  );

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
      {!llmReady && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>No LLM configured</AlertTitle>
          <AlertDescription>
            Multi-query retrieval, LLM answers and evaluation need <code>LLM_API_KEY</code> in <code>backend/.env</code>
            . Vector and hybrid retrieval work without it.
          </AlertDescription>
        </Alert>
      )}

      {/* ---------------------------------------------------------------- live status */}
      <Section
        tone="slate"
        aside={<RawDataButton />}
        title="Live configuration"
        description="Every change applies to the chatbot right away. There is nothing to save or activate."
      >
        <IndexMeta config={config} />
      </Section>

      {/* ---------------------------------------------------------------- models */}
      <ModelsSection />

      {/* ---------------------------------------------------------------- retrieval */}
      <Section
        title="Retrieval"
        description="Retrieval settings never re-embed anything: they only change how the existing index is searched."
      >
        <div className="space-y-4">
          <Alert variant="info">
            <Info />
            <AlertTitle>Chunking is entity based</AlertTitle>
            <AlertDescription>
              Each dish is stored as one chunk with its name, category, description, ingredients, allergens, price and
              nutrition.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="retrieval.strategy"
              render={({ field }) => (
                <CField label="Strategy" htmlFor="retrieval-strategy" hint={retrInfo?.description} span2>
                  <SelectControl
                    id="retrieval-strategy"
                    value={field.value}
                    onChange={field.onChange}
                    options={strategies.retrieval.map((s) => ({
                      value: s.id,
                      label: s.requires_llm && !llmReady ? `${s.name} (needs LLM)` : s.name,
                      disabled: s.requires_llm && !llmReady,
                    }))}
                  />
                </CField>
              )}
            />
          </div>

          <InactiveBanner strategy={retrInfo?.name ?? "this strategy"} labels={retrInactive} />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="retrieval.top_k"
              render={({ field }) => (
                <CField label="Top-K" tip="How many chunks are passed on as the final context.">
                  <SliderControl label="Top-K" value={field.value} onChange={field.onChange} min={1} max={20} />
                </CField>
              )}
            />
            <Controller
              control={control}
              name="retrieval.num_query_variants"
              render={({ field }) => (
                <CField
                  label="Query variants"
                  tip="How many rewritten queries the LLM generates (the original query is always searched too)."
                  disabled={!retrUses.has("num_query_variants")}
                >
                  <SliderControl
                    label="Query variants"
                    value={field.value}
                    onChange={field.onChange}
                    min={1}
                    max={8}
                    disabled={!retrUses.has("num_query_variants")}
                  />
                </CField>
              )}
            />
            <Controller
              control={control}
              name="retrieval.candidate_count"
              render={({ field }) => (
                <CField
                  label="Candidates per query"
                  tip="Chunks fetched per query variant / retriever branch before merging, fusing or reranking. Raised to Top-K if lower."
                  disabled={!retrUses.has("candidate_count")}
                >
                  <SliderControl
                    label="Candidates per query"
                    value={field.value}
                    onChange={field.onChange}
                    min={1}
                    max={100}
                    disabled={!retrUses.has("candidate_count")}
                  />
                </CField>
              )}
            />
            <Controller
              control={control}
              name="retrieval.rrf_k"
              render={({ field, fieldState }) => (
                <CField
                  label="RRF k"
                  htmlFor="rrf-k"
                  tip="Reciprocal Rank Fusion: each result scores 1/(k + rank) per ranked list, summed across lists. A larger k flattens the advantage of top ranks. 60 is the common default."
                  disabled={!retrUses.has("rrf_k")}
                  error={fieldState.error?.message}
                >
                  <NumberControl
                    id="rrf-k"
                    value={field.value}
                    onChange={field.onChange}
                    min={1}
                    max={1000}
                    disabled={!retrUses.has("rrf_k")}
                    invalid={!!fieldState.error}
                  />
                </CField>
              )}
            />
            <Controller
              control={control}
              name="retrieval.rerank_enabled"
              render={({ field }) => {
                const used = retrUses.has("rerank_enabled");
                return (
                  <CField
                    label="Cross-encoder rerank"
                    tip="Re-scores each (query, chunk) pair with a cross-encoder. Slower, often more precise."
                    disabled={!used}
                    hint={rerankLocked ? "Always on for this strategy." : undefined}
                  >
                    <SwitchControl
                      label="Cross-encoder rerank"
                      checked={rerankOn}
                      disabled={!used || rerankLocked}
                      onChange={field.onChange}
                      onText="Enabled"
                      offText="Disabled"
                    />
                  </CField>
                );
              }}
            />
            <Controller
              control={control}
              name="retrieval.reranker_model"
              render={({ field }) => {
                const used = retrUses.has("reranker_model") && rerankOn;
                return (
                  <CField
                    label="Reranker model"
                    htmlFor="reranker"
                    disabled={!used}
                    disabledReason={rerankOn ? undefined : "Turn rerank on to choose a model"}
                  >
                    <SelectControl
                      id="reranker"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!used}
                      options={Array.from(new Set([field.value, ...strategies.rerankers])).map((m) => ({
                        value: m,
                        label: m,
                      }))}
                    />
                  </CField>
                );
              }}
            />
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- footer */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        {status}
        <span className="hidden text-xs text-gray-500 sm:inline">Edits apply automatically.</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => form.reset(toFormValues(strategies.defaults))}
          >
            <RotateCcw /> Reset to defaults
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Compact metadata bar: index state, size, fingerprint, dataset, embedding, last update. */
function IndexMeta({ config }: { config: RagConfig }) {
  const qc = useQueryClient();
  const status = useIndexStatus(config.index_fingerprint);
  const index: RagIndex | null = status.data ?? config.index;

  const build = useMutation({
    mutationFn: rag.buildIndex,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.indexStatus });
      toast.success("Index build requested");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // When a build finishes, refresh the configuration so its `index` stays current.
  const state = index?.status;
  useEffect(() => {
    if (state === "ready" || state === "failed") qc.invalidateQueries({ queryKey: keys.config });
  }, [state, qc]);

  const done = Number(index?.progress?.done ?? 0);
  const total = Number(index?.progress?.total ?? 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : null;
  const building = state === "building" || state === "pending";

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Database className="size-4 text-gray-400" />
        {state === "ready" && (
          <Pill tone="success">
            <CheckCircle2 /> Index: Ready
          </Pill>
        )}
        {building && (
          <Pill tone="info">
            <Loader2 className="animate-spin" /> Index: {state === "pending" ? "Queued" : "Building"}
            {percent !== null && ` · ${percent}%`}
          </Pill>
        )}
        {state === "failed" && (
          <Pill tone="danger">
            <XCircle /> Index: Failed
          </Pill>
        )}
        {!index && !status.isLoading && <Pill>Index: Not built</Pill>}
        {index && (
          <>
            <Pill>{index.chunk_count} chunks</Pill>
            <Pill className="font-mono">
              {index.fingerprint.slice(0, 10)}
              <InfoTip text="Index fingerprint: a hash of the dataset version, the chunking parameters that matter for the chosen strategy, and the embedding model. Identical inputs reuse the same index. Retrieval settings are excluded." />
            </Pill>
            <Pill>dataset {index.dataset_version}</Pill>
          </>
        )}
        {(state === "failed" || !index) && (
          <Button type="button" size="sm" variant="outline" disabled={build.isPending} onClick={() => build.mutate()}>
            <RefreshCw /> {state === "failed" ? "Retry build" : "Build index"}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>
          Embedding <strong className="font-medium text-gray-700">{config.embedding.model}</strong> (
          {config.embedding.dimensions}-d)
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" /> Updated {dateTime(config.updated_at)}
        </span>
      </div>

      {building && (
        <div className="space-y-1.5 text-xs text-gray-500">
          <div>
            {String(index?.progress?.stage ?? "waiting for the worker")}. Chat keeps using the previous index until this
            is ready.
          </div>
          {percent !== null && <Progress value={percent} />}
        </div>
      )}
      {state === "failed" && index?.error && <p className="text-xs text-red-600">{index.error}</p>}
    </div>
  );
}
