"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Layers,
  ListOrdered,
  Microscope,
  Route,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/app/restaurant/components/ui/alert";
import { ms, titleCase } from "@/app/restaurant/lib/format";
import { cn } from "@/app/restaurant/lib/utils";
import { useLabStore } from "@/app/restaurant/stores/lab-store";
import type { RetrievalTrace, TraceChunk, TraceStage } from "@/app/restaurant/types/api";
import { Pill } from "./config-ui";
import { InfoTip } from "./fields";

export function InspectorTab() {
  const inspected = useLabStore((s) => s.inspected);
  return (
    <div className="space-y-6">
      {inspected ? (
        <TraceView trace={inspected.trace} source={inspected.source} label={inspected.label} />
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
            <Microscope className="size-8 text-emerald-600" />
            <p className="font-medium text-gray-900">Nothing to inspect yet</p>
            <p className="max-w-sm text-xs">
              Ask the assistant for a recommendation in the phone. Every retrieval shows up here with its steps,
              scores, ranking and the exact context sent to the LLM.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------ shared building blocks

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-gray-200 bg-white p-5 shadow-sm", className)}>{children}</section>;
}

/** Same header on every card of this tab. */
function CardTitle({
  icon,
  tip,
  children,
  right,
}: {
  icon: React.ReactNode;
  tip?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 [&_svg]:size-4 [&_svg]:text-gray-400">
        {icon}
        {children}
        {tip && <InfoTip text={tip} />}
      </h3>
      {right}
    </div>
  );
}

/** Small monospace tag (filters, configuration values). */
function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
    >
      {children}
    </span>
  );
}

// ------------------------------------------------------------------------ chunks and scores

const SIMILARITY_KEYS = new Set(["cosine_similarity", "best_cosine_similarity"]);

/** Colour of a score pill: similarity by strength, distance as informational, the ranking score emphasised. */
function scoreTone(key: string, value: number, primary?: string): string {
  if (SIMILARITY_KEYS.has(key)) {
    if (value >= 0.7) return "bg-emerald-100 text-emerald-800 ring-emerald-300";
    if (value >= 0.5) return "bg-lime-50 text-lime-800 ring-lime-200";
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  if (key.includes("distance")) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (key === primary) return "bg-emerald-600 text-white ring-emerald-600";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function ScorePills({ scores, primary }: { scores: Record<string, number>; primary?: string }) {
  const entries = Object.entries(scores);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span
          key={k}
          title={k === primary ? "Score this step ranks by" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] ring-1 ring-inset",
            scoreTone(k, v, primary),
            k === primary && "font-semibold",
          )}
        >
          <span className="opacity-70">{k}</span>
          <span className="font-semibold tabular-nums">{Number.isInteger(v) ? v : v.toPrecision(4)}</span>
        </span>
      ))}
    </div>
  );
}

function ChunkRow({ chunk, primary }: { chunk: TraceChunk; primary?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
        {chunk.rank}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {chunk.dish_names.map((n, i) => (
            <span key={`${n}-${i}`} className="text-sm font-medium text-gray-900">
              {n}
              {i < chunk.dish_names.length - 1 && <span className="text-gray-300">, </span>}
            </span>
          ))}
          {chunk.dish_names.length > 1 && (
            <span className="text-[11px] text-gray-500">({chunk.dish_names.length} dishes in one chunk)</span>
          )}
        </div>
        <ScorePills scores={chunk.scores} primary={primary} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          {open ? "Hide" : "Show"} chunk text
        </button>
        {open && (
          <pre className="max-h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-700">
            {chunk.content}
          </pre>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------ pipeline stages

/** One-line explanation of what a pipeline step does, keyed by the stage name the backend emits. */
function stageTip(stage: TraceStage): string {
  const n = stage.name;
  if (n.startsWith("vector")) return "Embeds the query and returns the chunks closest in meaning (cosine distance; lower is closer).";
  if (n === "lexical") return "Keyword search (PostgreSQL full-text). Catches exact words that embeddings can blur.";
  if (n === "merge") return "Combines the results of every query variant and drops duplicate chunks.";
  if (n === "rrf") return "Fuses the vector and keyword rankings by rank position, ignoring their raw scores.";
  if (n === "rerank") return "A cross-encoder re-reads each candidate together with the query and re-scores it for a sharper order.";
  return stage.description;
}

function StageView({ stage, index }: { stage: TraceStage; index: number }) {
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const items = all ? stage.items : stage.items.slice(0, 8);
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 pr-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-gray-400" />
          )}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
            {index + 1}
          </span>
          <div className="min-w-[8rem] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs font-semibold text-gray-900">{stage.name}</code>
              <Chip>{stage.score_type}</Chip>
            </div>
            <div className="mt-0.5 truncate text-xs text-gray-500">{stage.query ?? stage.description}</div>
          </div>
          <Pill className="ml-auto shrink-0 whitespace-nowrap">
            {stage.items.length} results · {ms(stage.latency_ms)}
          </Pill>
        </button>
        <InfoTip text={stageTip(stage)} />
      </div>
      {open && (
        <div className="space-y-2 border-t border-gray-100 p-3">
          <p className="text-xs text-gray-500">{stage.description}</p>
          {items.map((c) => (
            <ChunkRow key={`${stage.name}-${c.chunk_id}-${c.rank}`} chunk={c} primary={stage.score_type} />
          ))}
          {stage.items.length > 8 && (
            <button
              type="button"
              onClick={() => setAll((a) => !a)}
              className="cursor-pointer text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              {all ? "Show fewer" : `Show all ${stage.items.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------ trace overview

function describeFilters(filters: Record<string, unknown>): string[] {
  return Object.entries(filters)
    .filter(([, v]) => v !== null && v !== undefined && v !== false && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${titleCase(k)}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
}

function Term({ label, tip }: { label: string; tip?: string }) {
  return (
    <dt className="flex items-center gap-1 self-start pt-0.5 font-medium text-gray-500">
      {label}
      {tip && <InfoTip text={tip} />}
    </dt>
  );
}

/** The context string with each `[n] (dishes: …)` header picked out, like a lightweight syntax highlight. */
function ContextCode({ text }: { text: string }) {
  return (
    <pre className="max-h-80 overflow-auto overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-100">
      {text
        ? text.split("\n").map((line, i) =>
            /^\[\d+\]/.test(line) ? (
              <span key={i} className="block font-semibold text-emerald-300">
                {line}
              </span>
            ) : (
              <span key={i} className="block min-h-[1.25em]">
                {line}
              </span>
            ),
          )
        : "(empty context)"}
    </pre>
  );
}

export function TraceView({
  trace,
  source,
  label,
}: {
  trace: RetrievalTrace;
  source: "chat" | "manual";
  label: string;
}) {
  const filters = describeFilters(trace.filters);
  const breakdown = Object.entries(trace.latency_breakdown_ms ?? {});
  const [copied, setCopied] = useState(false);

  async function copyContext() {
    try {
      await navigator.clipboard.writeText(trace.context);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Context copied");
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  }

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- overview */}
      <Card>
        <CardTitle
          icon={<Route />}
          right={
            <div className="flex flex-wrap gap-1.5">
              <Pill tone={source === "chat" ? "success" : "info"}>{source === "chat" ? "From chat" : "Manual query"}</Pill>
              <Pill tone={trace.chunks.length ? "neutral" : "warning"}>{trace.chunks.length} chunks returned</Pill>
            </div>
          }
        >
          Retrieval trace
        </CardTitle>
        <p className="mb-4 -mt-1 text-xs text-gray-500">Configuration used for this retrieval, captured at the time it ran.</p>

        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-xs">
          <Term label="Query" tip="The text actually searched. Follow-up messages are rewritten into a standalone query." />
          <dd className="text-sm font-medium text-gray-900">{trace.query}</dd>

          {label && label !== trace.query && (
            <>
              <Term label="Customer said" />
              <dd className="text-sm text-gray-700">{label}</dd>
            </>
          )}

          <Term label="Query variants" tip="Alternative phrasings written by the LLM. Each one is searched to catch dishes the original wording misses." />
          <dd className="text-gray-700">
            {trace.query_variants.length ? (
              <ol className="list-decimal space-y-0.5 pl-4">
                {trace.query_variants.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ol>
            ) : (
              <span className="text-gray-400">None (this strategy searches the query as-is)</span>
            )}
          </dd>

          <Term label="Filters" tip="Hard rules (price, allergens, diet…) applied in the database before searching, so excluded dishes can never appear." />
          <dd className="flex flex-wrap gap-1.5">
            {filters.length ? filters.map((f) => <Chip key={f}>{f}</Chip>) : <span className="text-gray-400">None</span>}
          </dd>

          <Term label="Configuration" tip="Chunking, retrieval, embedding model and index used for this search." />
          <dd className="flex flex-wrap gap-1.5">
            <Chip>chunking: {trace.chunking.strategy}</Chip>
            <Chip>retrieval: {trace.retrieval.strategy}</Chip>
            <Chip>top-k {trace.retrieval.top_k}</Chip>
            {trace.retrieval.rerank_enabled && <Chip>rerank: {trace.retrieval.reranker_model}</Chip>}
            <Chip>embedding: {trace.embedding_model}</Chip>
            <Chip title="Index fingerprint">index {trace.index_fingerprint.slice(0, 8)}</Chip>
          </dd>

          <Term label="Latency" tip="Total retrieval time, split by step." />
          <dd>
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
              <Timer className="size-4 text-emerald-600" />
              {ms(trace.latency_ms)}
            </div>
            {breakdown.length > 0 && (
              <div className="mt-0.5 text-xs text-gray-500">
                {breakdown.map(([k, v]) => `${k.replace(/_ms$/, "").replace(/_/g, " ")} ${ms(v)}`).join(" · ")}
              </div>
            )}
          </dd>
        </dl>
      </Card>

      {trace.warnings.map((w, i) => (
        <Alert key={i}>
          <AlertTriangle />
          <AlertDescription>{w}</AlertDescription>
        </Alert>
      ))}

      {/* ---------------------------------------------------------------- stages */}
      {trace.stages.length > 0 && (
        <Card>
          <CardTitle
            icon={<Layers />}
            tip="The search steps, in order. Scores from different steps use different scales, so don't compare them."
          >
            Pipeline stages
          </CardTitle>
          <div className="space-y-2">
            {trace.stages.map((s, i) => (
              <StageView key={s.name} stage={s} index={i} />
            ))}
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------------- final ranking */}
      <Card>
        <CardTitle
          icon={<ListOrdered />}
          tip="The chunks left after every step, in the order they are given to the LLM."
          right={trace.final_score_type ? <Chip>ranked by {trace.final_score_type}</Chip> : undefined}
        >
          Final ranking
        </CardTitle>
        {trace.chunks.length ? (
          <div className="space-y-2">
            {trace.chunks.map((c) => (
              <ChunkRow key={c.chunk_id} chunk={c} primary={trace.final_score_type} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
            No chunks matched (the filters may have excluded everything).
          </p>
        )}
      </Card>

      {/* ---------------------------------------------------------------- LLM context */}
      <Card>
        <CardTitle
          icon={<FileText />}
          tip="The exact text the LLM saw when writing its answer."
          right={
            <button
              type="button"
              onClick={copyContext}
              disabled={!trace.context}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          }
        >
          Context sent to the LLM
        </CardTitle>
        <ContextCode text={trace.context} />
      </Card>
    </div>
  );
}
