"use client";

import { useState } from "react";
import { Download, Eye, EyeOff, Info, Loader2, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { CField, InactiveBanner, NumberControl, Section, SelectControl, SliderControl, SwitchControl } from "@/app/restaurant/components/panel/config-ui";
import { cn } from "@/app/restaurant/lib/utils";
import type { ModelOption, ModelRef } from "@/app/restaurant/types/api";
import { keys, useDefaults, useJobs, useModels } from "@/app/myresume/hooks/use-myresume";
import { downloadJobsPdf } from "@/app/myresume/lib/jobs-pdf";
import { myresume } from "@/app/myresume/lib/endpoints";
import { JobTitleButton } from "@/app/myresume/components/matcher/job-dialog";
import { METHOD_COLOR } from "@/app/myresume/lib/methods";
import { useSettings } from "@/app/myresume/stores/settings-store";
import type { Method, ModelCatalog } from "@/app/myresume/types/api";

const SEP = "|";
const encode = (r: ModelRef) => `${r.provider}${SEP}${r.model}`;
const decode = (v: string): ModelRef => ({ provider: v.slice(0, v.indexOf(SEP)), model: v.slice(v.indexOf(SEP) + 1) });

function optionList(catalog: ModelCatalog, models: ModelOption[], current: ModelRef, showWidth = false) {
  const providerName = (id: string) => catalog.providers.find((p) => p.id === id)?.name ?? id;
  const list = models.map((m) => {
    const configured = catalog.providers.find((p) => p.id === m.provider)?.configured;
    const width = showWidth && m.dimensions ? `, ${m.dimensions}-d` : "";
    const note = !configured ? "not set up" : m.quota_exhausted_for_seconds > 0 ? "free quota used up" : null;
    return { value: encode(m), label: `${providerName(m.provider)} · ${m.label}${width}${note ? ` (${note})` : ""}`, disabled: !configured };
  });
  return list.some((o) => o.value === encode(current))
    ? list
    : [{ value: encode(current), label: `${current.provider} · ${current.model}`, disabled: true }, ...list];
}

const METHODS_INFO: { id: Method; name: string; text: string }[] = [
  { id: "bm25", name: "BM25", text: "Keyword search. spaCy cleans the text, then BM25 ranks jobs by overlapping words, weighting rare words more." },
  { id: "vector", name: "Vector similarity", text: "Meaning search. The resume and jobs are embedded and ranked by cosine similarity, even without shared words." },
  { id: "hybrid", name: "Hybrid (BM25 + Vector, RRF)", text: "Both retrievers run on their own, then Reciprocal Rank Fusion merges their rankings." },
];

function MethodSection() {
  const method = useSettings((s) => s.config.method);
  const patch = useSettings((s) => s.patch);
  return (
    <Section title="Retrieval method" description="How jobs are found and ranked for a resume.">
      <div role="radiogroup" aria-label="Retrieval method" className="grid gap-2">
        {METHODS_INFO.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={method === m.id}
            onClick={() => patch({ method: m.id })}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none",
              method === m.id ? "border-(--brand) bg-(--brand)/5 ring-1 ring-(--brand)" : "border-gray-200",
            )}
          >
            <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: METHOD_COLOR[m.id] }} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{m.name}</span>
              <span className="mt-0.5 block text-xs text-gray-500">{m.text}</span>
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

function RetrievalSection() {
  const c = useSettings((s) => s.config);
  const patch = useSettings((s) => s.patch);
  const usesVector = c.method !== "bm25";
  const hybrid = c.method === "hybrid";
  return (
    <Section title="Retrieval settings" description="Applied to the next search and to the evaluation.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CField label="Top K" htmlFor="top-k" tip="How many nearest jobs are retrieved. All of them are sent to the model with the resume and are evaluated.">
          <SliderControl label="Top K" value={c.top_k} min={1} max={20} onChange={(top_k) => patch({ top_k })} />
        </CField>
        <CField
          label="Vector similarity threshold"
          disabled={!usesVector}
          disabledReason="BM25 does not use embeddings"
          tip="Jobs whose cosine similarity to the resume is below this are dropped from the vector results (and from the vector side of hybrid). 0 keeps everything."
        >
          <SliderControl label="Vector similarity threshold" value={c.vector_threshold} min={0} max={1} step={0.01} disabled={!usesVector} onChange={(vector_threshold) => patch({ vector_threshold })} />
        </CField>
        <CField
          label="Hybrid candidates per retriever"
          htmlFor="candidates"
          disabled={!hybrid}
          disabledReason="Only hybrid fuses two result lists"
          tip="Each retriever returns its own Top N jobs, then RRF merges them into the final Top K. The spec default is 20."
        >
          <NumberControl id="candidates" value={c.candidate_count} min={1} max={40} disabled={!hybrid} onChange={(candidate_count) => patch({ candidate_count })} />
        </CField>
        <CField
          label="RRF constant (k)"
          htmlFor="rrf-k"
          disabled={!hybrid}
          disabledReason="Only hybrid uses RRF"
          tip="score = Σ 1 / (k + rank). A larger k flattens the difference between ranks; 60 is the usual default."
        >
          <NumberControl id="rrf-k" value={c.rrf_k} min={1} max={1000} disabled={!hybrid} onChange={(rrf_k) => patch({ rrf_k })} />
        </CField>
      </div>
    </Section>
  );
}

function Bm25Section() {
  const c = useSettings((s) => s.config);
  const b = c.bm25;
  const patch = useSettings((s) => s.patchBm25);
  const defaults = useDefaults().data;
  const off = c.method === "vector";
  const noLemmas = defaults?.lemmatizer_available === false;
  return (
    <Section title="BM25 preprocessing (spaCy)" description="Applied to the jobs and the resume before BM25 scores them.">
      <div className="space-y-4">
        {off && <InactiveBanner strategy="vector similarity" labels={["spaCy preprocessing", "BM25 parameters"]} />}
        {noLemmas && (
          <Alert variant="info">
            <Info />
            <AlertDescription>spaCy&apos;s {defaults?.spacy_model} model is not installed on the server, so lemmatisation is skipped.</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CField label="Lowercase" disabled={off} tip="Treat “Python” and “python” as the same word.">
            <SwitchControl label="Lowercase" checked={b.lowercase} disabled={off} onChange={(lowercase) => patch({ lowercase })} />
          </CField>
          <CField label="Remove stop words" disabled={off} tip="Drop very common words (the, and, with) that carry no signal.">
            <SwitchControl label="Remove stop words" checked={b.remove_stopwords} disabled={off} onChange={(remove_stopwords) => patch({ remove_stopwords })} />
          </CField>
          <CField label="Remove punctuation" disabled={off} tip="Drop tokens that contain no letters or digits.">
            <SwitchControl label="Remove punctuation" checked={b.remove_punctuation} disabled={off} onChange={(remove_punctuation) => patch({ remove_punctuation })} />
          </CField>
          <CField label="Lemmatize" disabled={off || noLemmas} disabledReason={noLemmas ? "spaCy model missing" : undefined} tip="Reduce words to their base form: building → build, APIs → api, so inflected forms match.">
            <SwitchControl label="Lemmatize" checked={b.lemmatize} disabled={off || noLemmas} onChange={(lemmatize) => patch({ lemmatize })} />
          </CField>
          <CField label="Minimum token length" disabled={off} tip="Tokens shorter than this are dropped.">
            <SliderControl label="Minimum token length" value={b.min_token_length} min={1} max={10} disabled={off} onChange={(min_token_length) => patch({ min_token_length })} />
          </CField>
          <CField label="k1 (term saturation)" disabled={off} tip="How quickly repeating a word stops adding score. Typical 1.2–2.0.">
            <SliderControl label="k1" value={b.k1} min={0} max={3} step={0.1} disabled={off} onChange={(k1) => patch({ k1: Math.round(k1 * 10) / 10 })} />
          </CField>
          <CField label="b (length normalisation)" disabled={off} tip="0 ignores document length, 1 fully penalises long documents. Typical 0.75.">
            <SliderControl label="b" value={b.b} min={0} max={1} step={0.05} disabled={off} onChange={(v) => patch({ b: Math.round(v * 100) / 100 })} />
          </CField>
        </div>
      </div>
    </Section>
  );
}

function ModelsSection() {
  const query = useModels();
  const embedding = useSettings((s) => s.embedding);
  const setEmbedding = useSettings((s) => s.setEmbedding);
  const method = useSettings((s) => s.config.method);

  if (query.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  const catalog = query.data;
  if (!catalog) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load the models</AlertTitle>
        <AlertDescription>{query.error instanceof Error ? query.error.message : "Unknown error"}</AlertDescription>
      </Alert>
    );
  }
  const effectiveEmbedding = embedding && catalog.embedding.some((m) => encode(m) === encode(embedding)) ? embedding : catalog.default_embedding;
  const missing = catalog.providers.filter((p) => !p.configured && p.hint);
  return (
    <Section title="Models" description="The embedding model of vector and hybrid search (Gemini or Cloudflare Workers AI). BM25 uses no model. Saved in this browser only.">
      <div className="space-y-4">
        {missing.length > 0 && (
          <Alert variant="info">
            <Info />
            <AlertTitle>{missing.map((p) => p.name).join(", ")} not set up</AlertTitle>
            <AlertDescription>
              {missing.map((p) => (
                <span key={p.id} className="block">{p.name}: {p.hint}</span>
              ))}
            </AlertDescription>
          </Alert>
        )}
        <CField
          label="Embedding model"
          htmlFor="model-embedding"
          disabled={method === "bm25"}
          disabledReason="BM25 does not use embeddings"
          tip="Embeds the resume and the jobs for vector and hybrid search. Job vectors are computed once per model and kept in memory."
        >
          <SelectControl
            id="model-embedding"
            value={encode(effectiveEmbedding)}
            disabled={method === "bm25"}
            onChange={(v) => setEmbedding(encode(decode(v)) === encode(catalog.default_embedding) ? null : decode(v))}
            options={optionList(catalog, catalog.embedding, effectiveEmbedding, true)}
          />
        </CField>
      </div>
    </Section>
  );
}

/** The corpus every method searches. Hidden until asked for, then a bulleted list of the postings, each title opening the full posting in a modal. */
function JobsSection() {
  const [shown, setShown] = useState(false);
  const jobs = useJobs(shown);
  const qc = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    setExporting(true);
    try {
      await downloadJobsPdf(await qc.fetchQuery({ queryKey: keys.jobs, queryFn: myresume.jobs, staleTime: Infinity }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The PDF could not be created.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <Section
      title="Jobs"
      description="The job postings that are searched. BM25 and the embedding model index each posting's title, summary, responsibilities, qualifications and skills."
      aside={
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={exporting} onClick={() => void exportPdf()}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export PDF
          </Button>
          <Button type="button" variant="outline" size="sm" aria-expanded={shown} onClick={() => setShown((v) => !v)}>
            {shown ? <EyeOff /> : <Eye />} {shown ? "Hide jobs" : "Show jobs"}
          </Button>
        </div>
      }
    >
      {!shown ? (
        <p className="text-xs text-gray-500">Press “Show jobs” to list the available jobs with their descriptions and required qualifications.</p>
      ) : jobs.isLoading ? (
        <p className="inline-flex items-center gap-2 text-xs text-gray-500"><Loader2 className="size-3.5 animate-spin" /> Loading jobs…</p>
      ) : jobs.isError || !jobs.data ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load the jobs</AlertTitle>
          <AlertDescription>{jobs.error instanceof Error ? jobs.error.message : "Unknown error"}</AlertDescription>
        </Alert>
      ) : (
        <>
          <p className="mb-2 text-xs font-medium text-gray-700">{jobs.data.length} jobs</p>
          <ul className="max-h-[28rem] list-disc space-y-2.5 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/60 py-3 pr-3 pl-8 marker:text-(--brand)">
            {jobs.data.map((j) => (
              <li key={j.id} className="text-sm text-gray-900">
                <JobTitleButton job={j} className="font-semibold" />
                <span className="text-xs text-gray-500">
                  {" "}
                  · {j.company} · {j.location} · {j.work_mode} · {j.level} · {j.experience}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-700">{j.summary}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Skills:</span> {j.skills.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

export function ConfigurationTab() {
  const reset = useSettings((s) => s.reset);
  return (
    <div className="space-y-5">
      <JobsSection />
      <MethodSection />
      <RetrievalSection />
      <Bm25Section />
      <ModelsSection />
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={reset}>
          <RotateCcw /> Reset retrieval settings
        </Button>
      </div>
    </div>
  );
}
