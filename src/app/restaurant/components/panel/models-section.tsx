"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { useEmbeddingChoice, useModels } from "@/app/restaurant/hooks/use-rag-config";
import { keys } from "@/app/restaurant/hooks/use-restaurant";
import { errorMessage } from "@/app/restaurant/lib/client";
import { rag } from "@/app/restaurant/lib/endpoints";
import type { ModelCatalog, ModelOption, ModelRef, ModelSelection, RagConfig } from "@/app/restaurant/types/api";
import { CField, Section, SelectControl } from "./config-ui";

const SEP = "|";
const encode = (r: ModelRef) => `${r.provider}${SEP}${r.model}`;
const decode = (v: string): ModelRef => {
  const i = v.indexOf(SEP);
  return { provider: v.slice(0, i), model: v.slice(i + 1) };
};

/** Why a model cannot be picked (null = it can). A used-up free quota is only a note: the model stays selectable. */
function unavailable(catalog: ModelCatalog, m: ModelOption): string | null {
  return catalog.providers.find((p) => p.id === m.provider)?.configured ? null : "not set up";
}

function optionList(catalog: ModelCatalog, models: ModelOption[], current: ModelRef, showWidth = false) {
  const providerName = (id: string) => catalog.providers.find((p) => p.id === id)?.name ?? id;
  const list = models.map((m) => {
    const why = unavailable(catalog, m);
    const width = showWidth && m.dimensions ? `, ${m.dimensions}-d` : "";
    const note = why ?? (m.quota_exhausted_for_seconds > 0 ? "free quota used up" : null);
    return {
      value: encode(m),
      label: `${providerName(m.provider)} · ${m.label}${width}${note ? ` (${note})` : ""}`,
      disabled: why !== null,
    };
  });
  // A saved choice that is no longer offered still has to render.
  return list.some((o) => o.value === encode(current))
    ? list
    : [{ value: encode(current), label: `${current.provider} · ${current.model}`, disabled: true }, ...list];
}

/**
 * Pick the embedding, query and evaluation models.
 * The embedding model is this browser's own choice, sent with every message, so each visitor can search a different
 * pre-built index. The query and evaluation models are shared by everyone.
 */
export function ModelsSection() {
  const qc = useQueryClient();
  const query = useModels();
  const embedding = useEmbeddingChoice();

  const save = useMutation({
    mutationFn: rag.updateModels,
    onSuccess: (cfg: RagConfig, vars) => {
      qc.setQueryData<RagConfig>(keys.config, cfg);
      qc.setQueryData<ModelCatalog>(keys.models, (old) => (old ? { ...old, selection: vars } : old));
      qc.invalidateQueries({ queryKey: keys.strategies });
      qc.invalidateQueries({ queryKey: keys.indexStatus });
      toast.success("Models updated");
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: keys.models });
      toast.error(errorMessage(e));
    },
  });

  if (query.isLoading) return <Skeleton className="h-44 w-full rounded-xl" />;
  const catalog = query.data;
  if (!catalog) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load the models</AlertTitle>
        <AlertDescription>{errorMessage(query.error)}</AlertDescription>
      </Alert>
    );
  }

  const selection: ModelSelection = save.isPending && save.variables ? save.variables : catalog.selection;
  const choose = (slot: keyof ModelSelection) => (value: string) => {
    if (value !== encode(selection[slot])) save.mutate({ ...selection, [slot]: decode(value) });
  };
  const chooseEmbedding = (value: string) => {
    embedding.setEmbedding(value === encode(catalog.default_embedding) ? null : decode(value));
    toast.success("Embedding model set for this browser");
  };

  const missing = catalog.providers.filter((p) => !p.configured && p.hint);
  const exhausted = [...catalog.chat, ...catalog.embedding].filter((m) => m.quota_exhausted_for_seconds > 0);

  return (
    <Section
      title="Models"
      description="Choose the model that embeds your questions (yours alone), the one that answers and searches, and the one that judges the evaluation. Gemini and Cloudflare Workers AI are available."
      aside={
        save.isPending ? <Loader2 className="size-4 animate-spin text-gray-400" aria-label="Applying" /> : undefined
      }
    >
      <div className="space-y-4">
        {missing.length > 0 && (
          <Alert variant="info">
            <Info />
            <AlertTitle>{missing.map((p) => p.name).join(", ")} not set up</AlertTitle>
            <AlertDescription>
              {missing.map((p) => (
                <span key={p.id} className="block">
                  {p.name}: {p.hint}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}
        {exhausted.length > 0 && (
          <Alert variant="info">
            <Info />
            <AlertTitle>Free quota used up</AlertTitle>
            <AlertDescription>
              Models marked &quot;free quota used up&quot; reported that their free quota is finished. You can still pick them; requests may fail until the quota comes back a little later.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-4">
          <CField
            label="Embedding model"
            htmlFor="model-embedding"
            tip="Turns dishes and questions into vectors for search. It is sent with each of your messages, which then search that model's pre-built index. Other visitors keep their own choice."
            hint="Saved in this browser only"
          >
            <SelectControl
              id="model-embedding"
              value={encode(embedding.effective ?? catalog.default_embedding)}
              onChange={chooseEmbedding}
              options={optionList(catalog, catalog.embedding, embedding.effective ?? catalog.default_embedding, true)}
            />
          </CField>
          <CField
            label="Query model"
            htmlFor="model-llm"
            tip="Writes the replies and rewrites questions into search queries (and the query variants for multi-query retrieval)."
          >
            <SelectControl
              id="model-llm"
              value={encode(selection.llm)}
              onChange={choose("llm")}
              options={optionList(catalog, catalog.chat, selection.llm)}
              disabled={save.isPending}
            />
          </CField>
          <CField
            label="Evaluation model"
            htmlFor="model-judge"
            tip="The judge that scores relevance and the LLM-based RAGAS metrics when you press Evaluate."
          >
            <SelectControl
              id="model-judge"
              value={encode(selection.judge)}
              onChange={choose("judge")}
              options={optionList(catalog, catalog.chat, selection.judge)}
              disabled={save.isPending}
            />
          </CField>
        </div>
        <p className="text-xs text-gray-500">
          The menu is indexed ahead of time with both embedding models. Each message names the model to search with, so
          nothing is re-indexed and visitors do not affect each other. Query and evaluation models are shared.
        </p>
      </div>
    </Section>
  );
}
