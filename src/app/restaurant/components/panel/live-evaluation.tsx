"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  MessageSquareText,
  Play,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { useLiveEvaluations, useLiveScores } from "@/app/restaurant/hooks/use-evaluations";
import { useLocalChat } from "@/app/restaurant/hooks/use-local-chat";
import { keys, useMenu } from "@/app/restaurant/hooks/use-restaurant";
import { useRagConfig } from "@/app/restaurant/hooks/use-rag-config";
import { errorMessage } from "@/app/restaurant/lib/client";
import { evaluations } from "@/app/restaurant/lib/endpoints";
import { configLabel, dateTime, ms, score } from "@/app/restaurant/lib/format";
import { METRIC_BY_KEY, POOR_THRESHOLD, formatMetric } from "@/app/restaurant/lib/metrics";
import { cn } from "@/app/restaurant/lib/utils";
import type {
  ChatMessage,
  ConfigSnapshot,
  JobStatus,
  LiveEvaluation,
  LiveEvaluations,
  RetrievalTrace,
} from "@/app/restaurant/types/api";
import { Pill } from "./config-ui";
import { InfoTip } from "./fields";
import { LoadingOverlay } from "./loading-overlay";
import { EvaluationProgress, ScoringPercent, ScoringProgress } from "./scoring-progress";

const RETRIEVAL_KEYS = ["precision_at_5", "recall_at_5", "precision_at_10", "recall_at_10"];
/** LLM-free RAGAS metrics, scored against the index chunks that cover the judged-relevant dishes. */
const RAGAS_KEYS = ["non_llm_context_precision", "non_llm_context_recall"];
/** LLM-based RAGAS metrics (judge LLM + embeddings); the reason evaluations are limited. */
const LLM_RAGAS_KEYS = ["faithfulness", "answer_relevancy", "llm_context_precision", "llm_context_recall"];

// ------------------------------------------------------------------------------------------ primitives

/** Card used by every block of this tab, so they share padding, border and shadow. */
function Panel({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-gray-200 bg-card p-5 shadow-sm", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  switch (status) {
    case "completed":
      return (
        <Pill tone="success" className="gap-1 py-0.5">
          <CheckCircle2 /> Completed
        </Pill>
      );
    case "failed":
      return (
        <Pill tone="danger" className="gap-1 py-0.5">
          <XCircle /> Failed
        </Pill>
      );
    case "running":
      return (
        <Pill tone="info" className="gap-1 py-0.5">
          <Loader2 className="animate-spin" /> Running
        </Pill>
      );
    case "awaiting":
      return (
        <Pill className="gap-1 py-0.5">
          <Clock /> Not evaluated
        </Pill>
      );
    default:
      return (
        <Pill className="gap-1 py-0.5">
          <Clock /> Pending
        </Pill>
      );
  }
}

const TH = "px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap text-gray-600";
const TR = "border-b border-gray-100 text-xs transition-colors last:border-b-0 hover:bg-slate-50/80";
const TD = "px-4 py-3 align-top";

function DataTable({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-slate-50">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ metrics

function Kpi({ metricKey, value }: { metricKey: string; value: number | null | undefined }) {
  const m = METRIC_BY_KEY[metricKey];
  const ratio = m.group === "performance" ? null : value;
  return (
    <div className="rounded-xl border border-gray-200 bg-card p-4 shadow-sm transition-all hover:border-gray-300">
      <div className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-500">
        {m.label}
        <InfoTip text={m.description} />
      </div>
      <div className="mb-2 font-mono text-2xl font-bold tracking-tight text-gray-900">
        {formatMetric(metricKey, value)}
      </div>
      {ratio !== null && ratio !== undefined ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
          />
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">Mean per question</p>
      )}
    </div>
  );
}

function Cell({
  v,
  warn = true,
  loading = false,
}: {
  v: number | null | undefined;
  warn?: boolean;
  loading?: boolean;
}) {
  return (
    <td
      className={cn(
        TD,
        "text-right font-mono tabular-nums text-gray-800",
        !loading && warn && typeof v === "number" && v < POOR_THRESHOLD && "font-semibold text-rose-600",
      )}
    >
      {loading ? <Loader2 className="ml-auto size-3.5 animate-spin text-gray-400" aria-label="Scoring" /> : score(v, 3)}
    </td>
  );
}

const isScoring = (i: LiveEvaluation) => i.status === "pending" || i.status === "running";
/** Retrieval numbers exist once the retrieval stage has finished; RAGAS numbers once the whole item is done. */
const retrievalPending = (i: LiveEvaluation) =>
  isScoring(i) && ["queued", "judging_relevance", "retrieval"].includes(i.stage);
/** The LLM-free RAGAS scores are saved before the (slower) LLM-based ones are computed. */
const ragasPending = (i: LiveEvaluation) => isScoring(i) && i.stage !== "ragas_llm";

function Trend({ items }: { items: LiveEvaluation[] }) {
  // Oldest -> newest, only questions that have at least one score.
  const data = useMemo(
    () =>
      [...items]
        .reverse()
        .filter((i) => i.retrieval_metrics.recall_at_5 != null || i.ragas_scores.non_llm_context_recall != null)
        .map((i, n) => ({
          n: n + 1,
          "R@5": i.retrieval_metrics.recall_at_5 ?? undefined,
          "P@5": i.retrieval_metrics.precision_at_5 ?? undefined,
          "Ctx prec.": i.ragas_scores.non_llm_context_precision ?? undefined,
          "Ctx rec.": i.ragas_scores.non_llm_context_recall ?? undefined,
        })),
    [items],
  );
  if (data.length < 2) return null;
  const colors = {
    "R@5": "#166534",
    "P@5": "#16a34a",
    "Ctx prec.": "#0d9488",
    "Ctx rec.": "#65a30d",
  } as const;
  return (
    <Panel
      title="Scores per question, as they arrive"
      description="Oldest to newest. Gaps mean the metric was undefined for that question."
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-gray-200)" />
            <XAxis dataKey="n" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
            <ChartTooltip formatter={(v) => (typeof v === "number" ? v.toFixed(3) : String(v))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {(Object.keys(colors) as (keyof typeof colors)[]).map((k) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={colors[k]}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------------------------------ question feed

/** Small uppercase caption above each block of the inspection card. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
      {children}
    </div>
  );
}

/** One score as a small badge: caption on top, monospace value below; a score under the threshold turns red. */
function ScoreBadge({
  label,
  value,
  loading,
  text,
}: {
  label: string;
  value?: number | null;
  loading?: boolean;
  text?: string;
}) {
  const low = !loading && typeof value === "number" && value < POOR_THRESHOLD;
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-3 py-2 shadow-sm",
        low ? "border-red-200 bg-red-50/60" : "border-slate-200",
      )}
    >
      <div className="truncate text-[11px] text-slate-500" title={label}>
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold tabular-nums",
          low ? "text-red-600" : value == null && !loading ? "text-slate-300" : "text-slate-800",
        )}
      >
        {loading ? "scoring…" : (text ?? score(value, 3))}
      </div>
    </div>
  );
}

/**
 * The expanded row: an "inspection card". The card chrome (inset background, border, padding) and the two-column
 * grids only apply from `lg` up; below that the same blocks simply stack.
 */
function Detail({ item, nameOf, isLast }: { item: LiveEvaluation; nameOf: (id: string) => string; isLast: boolean }) {
  const relevant = new Set(item.relevant_dish_ids);
  const [showCtx, setShowCtx] = useState(false);
  const judged = item.stage !== "queued" && item.stage !== "judging_relevance";
  const unscored = item.stage === NOT_SCORED || item.stage === AWAITING;
  const filters = Object.entries(item.filters).filter(([k]) => k !== "available_only");
  const showQuery = item.query !== item.question;
  const metrics: [string, string][] = [
    ["Context precision", "non_llm_context_precision"],
    ["Context recall", "non_llm_context_recall"],
    ["Faithfulness", "faithfulness"],
    ["Answer relevancy", "answer_relevancy"],
    ["LLM context precision", "llm_context_precision"],
    ["LLM context recall", "llm_context_recall"],
  ];

  return (
    // Pinned to the visible width of the scrolling table, so the card never runs off-screen.
    <div className="sticky left-0 w-[calc(100cqw-16px)] p-4 lg:p-3">
      <div className="space-y-4 text-xs lg:my-0 lg:rounded-xl lg:border lg:border-slate-200/80 lg:bg-slate-50/80 lg:p-5">
        {item.error && (
          <Alert variant="destructive">
            <XCircle />
            <AlertDescription>{item.error}</AlertDescription>
          </Alert>
        )}
        {item.stage === AWAITING && (
          <Alert variant="info">
            <Info />
            <AlertDescription>
              {isLast
                ? "Not evaluated yet. Press Evaluate last question to score it."
                : "Not evaluated. Evaluate only scores the last question you asked, and a newer one exists."}
            </AlertDescription>
          </Alert>
        )}
        {item.stage === NOT_SCORED && (
          <Alert variant="info">
            <Ban />
            <AlertDescription>
              This question cannot be evaluated: the server has no record of it (it is older than a day, or evaluation
              was off when you asked it).
            </AlertDescription>
          </Alert>
        )}

        {/* 1 · query and filters */}
        {(showQuery || filters.length > 0) && (
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
            {showQuery && (
              <div>
                <SectionLabel>Standalone search query</SectionLabel>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-card px-3 py-1 font-mono text-xs text-slate-700 shadow-sm">
                  {item.query}
                </span>
              </div>
            )}
            {filters.length > 0 && (
              <div>
                <SectionLabel>Hard filters applied</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {filters.map(([k, v]) => (
                    <span key={k} className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2 · relevant vs retrieved */}
        {!unscored && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-card p-3">
              <SectionLabel>
                Relevant dishes ({item.relevant_dish_ids.length})
                <InfoTip text="No human labelled this question. The judge LLM read the whole menu and listed every dish a perfect answer should contain; Precision/Recall are computed against that list." />
              </SectionLabel>
              <p className="mb-2 text-[11px] text-slate-400">Judged by {item.judge_model || "the judge LLM"}</p>
              <div className="flex flex-wrap gap-1.5">
                {!judged && <span className="text-slate-500">Judging…</span>}
                {judged &&
                  item.relevant_dish_ids.map((id) => (
                    <span
                      key={id}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700"
                    >
                      {nameOf(id)}
                    </span>
                  ))}
                {judged && !item.relevant_dish_ids.length && (
                  <span className="text-slate-500">The judge found no dish on the menu that fits this question.</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-card p-3">
              <SectionLabel>Retrieved (ranked)</SectionLabel>
              <p className="mb-2 text-[11px] text-slate-400">Green outline: also judged relevant</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {item.retrieved_dish_ids.slice(0, 10).map((id, i) => (
                  <span
                    key={id}
                    title={relevant.has(id) ? "Judged relevant" : "Not judged relevant"}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1 text-slate-700",
                      relevant.has(id)
                        ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
                        relevant.has(id) ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600",
                      )}
                    >
                      {i + 1}
                    </span>
                    {nameOf(id)}
                  </span>
                ))}
                {!item.retrieved_dish_ids.length && (
                  <span className="text-slate-500">{judged ? "Nothing retrieved." : "Waiting…"}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3 · the reply */}
        <div>
          <SectionLabel>Reply the customer saw</SectionLabel>
          <p className="rounded-r-lg border-l-4 border-emerald-500 bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-800 shadow-sm">
            {item.answer || "(none)"}
          </p>
        </div>

        {/* 4 · scores and context */}
        {!unscored && (
          <div>
            <SectionLabel>Scores</SectionLabel>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {metrics.map(([label, key]) => (
                <ScoreBadge
                  key={key}
                  label={label}
                  value={item.ragas_scores[key]}
                  loading={RAGAS_KEYS.includes(key) ? ragasPending(item) : isScoring(item)}
                />
              ))}
              <ScoreBadge label="Retrieval latency" text={ms(item.latency_ms)} />
            </div>
          </div>
        )}
        {item.contexts.length > 0 && (
          <div>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-800"
              onClick={() => setShowCtx((v) => !v)}
              aria-expanded={showCtx}
            >
              {showCtx ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {showCtx ? "Hide" : "Show"} context given to the LLM ({item.contexts.length} chunks)
            </button>
            {showCtx && (
              <ol className="mt-3 space-y-1.5">
                {item.contexts.map((c, i) => (
                  <li key={i}>
                    <pre className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-card p-3 font-mono leading-relaxed whitespace-pre-wrap text-slate-700">
                      {c}
                    </pre>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Table of the questions asked. Spacing/zebra/sizing refinements sit behind `lg:` so narrow layouts keep the compact look.
const FEED_TH =
  "sticky top-0 z-10 bg-card px-3 py-3 text-center text-xs font-medium whitespace-nowrap text-slate-600 shadow-sm transition-colors hover:bg-slate-50 lg:px-4";
const FEED_TD = "border-b border-slate-100 px-3 py-3 align-middle lg:px-4 lg:py-4";

/** One metric value: tabular mono digits, centered; a score below the threshold gets a light red pill. */
function MetricCell({
  v,
  warn = true,
  loading = false,
}: {
  v: number | null | undefined;
  warn?: boolean;
  loading?: boolean;
}) {
  const low = !loading && warn && typeof v === "number" && v < POOR_THRESHOLD;
  return (
    <td className={cn(FEED_TD, "text-center")}>
      {loading ? (
        <Loader2 className="mx-auto size-3.5 animate-spin text-slate-400" aria-label="Scoring" />
      ) : (
        <span
          className={cn(
            "inline-block font-mono text-xs tabular-nums",
            v == null ? "text-slate-300" : "text-slate-700",
            low && "rounded bg-red-50 px-2 py-0.5 font-semibold text-red-600",
          )}
        >
          {score(v, 3)}
        </span>
      )}
    </td>
  );
}

function Feed({ items }: { items: LiveEvaluation[] }) {
  const { dishById } = useMenu();
  const nameOf = (id: string) => dishById.get(id)?.name ?? id;
  const [open, setOpen] = useState<string | null>(null);
  const cols = [
    ["P@5", "Precision@5"],
    ["R@5", "Recall@5"],
    ["Ctx prec.", "Context precision"],
    ["Ctx rec.", "Context recall"],
    ["Faith.", "Faithfulness"],
    ["Ans. rel.", "Answer relevancy"],
    ["LLM prec.", "LLM context precision"],
    ["LLM rec.", "LLM context recall"],
  ] as const;

  return (
    <Panel
      title="Questions customers asked"
      description={`Read from this browser's storage, newest first. Click a row for the reply, the retrieved dishes and the context. Scores below ${POOR_THRESHOLD} are highlighted.`}
    >
      <div className="@container max-h-[640px] w-full overflow-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className={cn(FEED_TH, "w-10 min-w-10 pr-0")} />
              <th className={cn(FEED_TH, "min-w-[260px] text-left")}>Question</th>
              <th className={cn(FEED_TH, "min-w-[150px] text-left")}>Status</th>
              {cols.map(([short, label]) => (
                <th key={short} className={cn(FEED_TH, "min-w-[88px]")} title={label}>
                  {short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i, n) => (
              <Fragment key={i.id}>
                <tr
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-slate-100/70",
                    n % 2 === 1 && "lg:bg-slate-50/50",
                    open === i.id && "bg-slate-100/70 lg:bg-slate-100/70",
                  )}
                  onClick={() => setOpen(open === i.id ? null : i.id)}
                  aria-expanded={open === i.id}
                >
                  <td className={cn(FEED_TD, "pr-0 text-slate-400")}>
                    {open === i.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </td>
                  <td className={FEED_TD}>
                    <div className="line-clamp-2 max-w-[280px] text-sm font-medium text-slate-800" title={i.question}>
                      {i.question}
                    </div>
                    <div
                      className="mt-1 max-w-[280px] truncate font-mono text-xs text-slate-400"
                      title={`${dateTime(i.created_at)} · ${configLabel(i.config_snapshot)}`}
                    >
                      {dateTime(i.created_at)} · {configLabel(i.config_snapshot)}
                    </div>
                  </td>
                  <td className={FEED_TD}>
                    <div className="flex flex-col items-start gap-1">
                      {i.stage === NOT_SCORED ? (
                        <Pill className="gap-1 py-0.5">
                          <Ban /> Not scored
                        </Pill>
                      ) : (
                        <StatusBadge status={i.status} />
                      )}
                      {isScoring(i) && <ScoringProgress key={i.stage} stage={i.stage} />}
                    </div>
                  </td>
                  <MetricCell v={i.retrieval_metrics.precision_at_5} warn={false} loading={retrievalPending(i)} />
                  <MetricCell v={i.retrieval_metrics.recall_at_5} loading={retrievalPending(i)} />
                  <MetricCell v={i.ragas_scores.non_llm_context_precision} loading={ragasPending(i)} />
                  <MetricCell v={i.ragas_scores.non_llm_context_recall} loading={ragasPending(i)} />
                  {LLM_RAGAS_KEYS.map((k) => (
                    <MetricCell key={k} v={i.ragas_scores[k]} loading={isScoring(i)} />
                  ))}
                </tr>
                {open === i.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={11} className="border-b border-slate-100 p-0">
                      <Detail item={i} nameOf={nameOf} isLast={n === 0} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------------------------------ questions (from this browser)

const NOT_SCORED = "not_scored";
const AWAITING = "awaiting";

interface LocalQuestion {
  id: string; // the assistant message id, which is also what the scores are keyed by
  sessionId: string;
  question: string;
  answer: string;
  contexts: string[];
  query: string;
  filters: Record<string, unknown>;
  snapshot: Partial<ConfigSnapshot>;
  latencyMs: number;
  createdAt: string;
}

/** The search questions of this browser's conversation: what was asked, the reply and the context it was built from. */
function localQuestions(sessionId: string, messages: ChatMessage[]): LocalQuestion[] {
  const out: LocalQuestion[] = [];
  messages.forEach((m, i) => {
    const asked = messages[i - 1];
    if (m.role !== "assistant" || m.metadata?.intent !== "search" || asked?.role !== "user") return;
    const trace = m.metadata.trace as RetrievalTrace | undefined;
    out.push({
      id: m.id,
      sessionId,
      question: asked.content,
      answer: m.content,
      contexts: trace?.chunks.map((c) => c.content) ?? [],
      query: typeof m.metadata.query === "string" ? m.metadata.query : asked.content,
      filters: (m.metadata.filters as Record<string, unknown> | undefined) ?? {},
      snapshot: trace
        ? {
            chunking: trace.chunking,
            retrieval: trace.retrieval,
            index_fingerprint: trace.index_fingerprint,
          }
        : {},
      latencyMs: trace?.latency_ms ?? 0,
      createdAt: m.created_at,
    });
  });
  return out;
}

/**
 * The questions asked from this browser, newest first. The text comes from localStorage (the server does not keep
 * it); the scores are looked up by message id. A question the server never queued (evaluation limit reached,
 * live evaluation off) shows as "not scored".
 */
function useQuestions(): LiveEvaluation[] {
  const { sessionId, messages } = useLocalChat();
  const local = useMemo(() => (sessionId ? localQuestions(sessionId, messages) : []), [sessionId, messages]);
  const scores = useLiveScores(useMemo(() => local.map((q) => q.id), [local]));
  return useMemo(() => {
    const byMessage = new Map((scores.data ?? []).map((s) => [s.message_id, s]));
    const known = scores.isSuccess || scores.isError || local.length === 0;
    return local
      .map((q): LiveEvaluation => {
        const s = byMessage.get(q.id);
        return {
          id: s?.id ?? q.id,
          session_id: q.sessionId,
          message_id: q.id,
          config_snapshot: s?.config_snapshot ?? q.snapshot,
          question: q.question,
          query: q.query,
          filters: s?.filters ?? q.filters,
          answer: q.answer,
          contexts: q.contexts,
          status: s?.status ?? (known ? "completed" : "pending"),
          stage: s?.stage ?? (known ? NOT_SCORED : "queued"),
          relevant_dish_ids: s?.relevant_dish_ids ?? [],
          retrieved_dish_ids: s?.retrieved_dish_ids ?? [],
          retrieval_metrics: s?.retrieval_metrics ?? {},
          ragas_scores: s?.ragas_scores ?? {},
          latency_ms: s?.latency_ms || q.latencyMs,
          judge_model: s?.judge_model ?? "",
          error: s?.error ?? null,
          created_at: q.createdAt,
          completed_at: s?.completed_at ?? null,
        };
      })
      .reverse();
  }, [local, scores.data, scores.isSuccess, scores.isError]);
}

/** Evaluations call the LLM many times per question, so everyone gets a fixed number. */
function UsageAlert({ usage }: { usage: LiveEvaluations["usage"] }) {
  const { limit, used, remaining, reset_in_seconds: reset, window_seconds: window } = usage;
  const hours = Math.max(1, Math.round(window / 3600));
  const resetIn = reset >= 3600 ? `${Math.ceil(reset / 3600)} h` : `${Math.max(1, Math.ceil(reset / 60))} min`;
  const out = remaining <= 0;
  return (
    <Alert variant="info" className="mt-4">
      <Info />
      <AlertTitle>{out ? "Evaluation limit reached" : `${remaining} of ${limit} evaluations left`}</AlertTitle>
      <AlertDescription>
        {out
          ? `Maximum ${limit} evaluations every ${hours} hours. You can run another in about ${resetIn}; chat keeps working.`
          : `Maximum ${limit} evaluations every ${hours} hours, because each one calls the LLM many times (${used} used${reset > 0 ? `, resets in about ${resetIn}` : ""}).`}
      </AlertDescription>
    </Alert>
  );
}

// ------------------------------------------------------------------------------------------ tab

export function LiveEvaluationView() {
  const qc = useQueryClient();
  const live = useLiveEvaluations();
  const rows = useQuestions();
  const { data: current } = useRagConfig();
  const clear = useMutation({
    mutationFn: evaluations.clearLive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.live });
      toast.success("Evaluation history cleared.");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  // Evaluate always scores the last question asked (rows are newest first), and only while it is still waiting.
  const last = rows[0];
  const lastWaiting = last?.stage === AWAITING ? last : undefined;
  const run = useMutation({
    mutationFn: () => evaluations.runLive([lastWaiting!.message_id]),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: keys.live });
      qc.invalidateQueries({ queryKey: ["live-scores"] });
      toast.success(r.queued ? "Evaluating the last question…" : "The last question was already evaluated.");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (live.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (live.error || !live.data) {
    return (
      <Alert variant="destructive">
        <XCircle />
        <AlertTitle>Couldn&apos;t load evaluations</AlertTitle>
        <AlertDescription>{errorMessage(live.error)}</AlertDescription>
      </Alert>
    );
  }

  const { enabled, summary, usage } = live.data;
  const inFlight = summary.pending + summary.running;
  const mine = rows.filter(isScoring); // this browser's questions being scored right now (the feed also holds other visitors')
  const scored = summary.completed + summary.failed;
  const hasMetrics = Object.values(summary.metrics).some((v) => v !== null);
  const isActive = (g: (typeof summary.by_config)[number]) =>
    !!current &&
    g.config_snapshot.index_fingerprint === current.index_fingerprint &&
    JSON.stringify(g.config_snapshot.retrieval) === JSON.stringify(current.retrieval);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------ status */}
      <section className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Play className="size-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-900">Evaluation</h3>
          <Button
            type="button"
            size="sm"
            className="ml-auto bg-emerald-600 font-medium text-white hover:bg-emerald-700"
            disabled={!enabled || !lastWaiting || run.isPending || (!!usage?.enabled && usage.remaining <= 0)}
            title={last && !lastWaiting ? "The last question is already evaluated (or cannot be). Ask a new one." : undefined}
            onClick={() => run.mutate()}
          >
            {run.isPending ? <Loader2 className="animate-spin" /> : <Play />}
            Evaluate last question
          </Button>
        </div>

        {!enabled && (
          <Alert className="mt-4">
            <AlertTriangle />
            <AlertTitle>Evaluation is turned off</AlertTitle>
            <AlertDescription>
              Set <code>LIVE_EVALUATION_ENABLED=true</code> in <code>backend/.env</code> and restart the backend.
            </AlertDescription>
          </Alert>
        )}

        {usage?.enabled && <UsageAlert usage={usage} />}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Tag>
            <strong className="font-semibold text-gray-900">{scored}</strong> scored
          </Tag>
          <Tag>
            {inFlight > 0 && <Loader2 className="size-3 animate-spin" />}
            <strong className="font-semibold text-gray-900">{inFlight}</strong> in progress
          </Tag>
          {summary.failed > 0 && (
            <Tag>
              <strong className="font-semibold text-rose-600">{summary.failed}</strong> failed
            </Tag>
          )}
          <Tag>Relevance judge: {summary.judge_model}</Tag>
          <button
            type="button"
            disabled={scored + inFlight === 0 || clear.isPending}
            onClick={() => window.confirm("Delete all evaluation records?") && clear.mutate()}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-3.5" /> Clear history
          </button>
        </div>

        {mine.map((i) => (
          <EvaluationProgress key={`${i.id}-${i.stage}`} question={i.question} stage={i.stage} />
        ))}

        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          Ask the assistant for recommendations, then press <strong>Evaluate last question</strong> to score the most
          recent question asked in this browser. Nothing is scored while you chat. The questions, replies and retrieved context are read from
          this browser&apos;s localStorage; the server keeps only the scores. Without human labels, the dishes that{" "}
          <em>should</em> have been found are judged by the LLM against the whole menu. Precision/Recall are computed
          from the retrieved dishes, RAGAS context precision/recall by matching the chunks the answer was built from
          with the chunks that cover those dishes, and faithfulness, answer relevancy and LLM context precision/recall
          by asking the judge LLM. Treat these as estimates and use them to compare configurations on the same traffic.
        </p>
      </section>

      {!rows.length && !hasMetrics ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          <MessageSquareText className="size-5" />
          <p>
            No questions yet. Ask the assistant for a recommendation in the phone simulator (for example{" "}
            <em>&ldquo;high-protein chicken under $20&rdquo;</em>). It appears here, read from this browser&apos;s
            storage; press Evaluate last question to score it.
          </p>
        </div>
      ) : (
        <LoadingOverlay loading={clear.isPending} label="Clearing history…">
          <div className="space-y-6">
            <LoadingOverlay loading={inFlight > 0} label={
                mine[0] ? (
                  <>
                    Updating scores ({inFlight} in progress)… <ScoringPercent key={mine[0].stage} stage={mine[0].stage} />
                  </>
                ) : (
                  `Updating scores (${inFlight} in progress)…`
                )
              }
            >
              <div className="space-y-6">
                {hasMetrics && (
                  <>
                    <section className="@container">
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Retrieval (averages over all scored questions)
                      </h3>
                      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
                        {RETRIEVAL_KEYS.map((k) => (
                          <Kpi key={k} metricKey={k} value={summary.metrics[k]} />
                        ))}
                      </div>
                    </section>
                    <section className="@container">
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">Context quality (RAGAS, no LLM)</h3>
                      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-3">
                        {RAGAS_KEYS.map((k) => (
                          <Kpi key={k} metricKey={k} value={summary.metrics[k]} />
                        ))}
                        <Kpi metricKey="avg_retrieval_latency_ms" value={summary.metrics.avg_retrieval_latency_ms} />
                      </div>
                    </section>
                    <section className="@container">
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">Answer quality (RAGAS, LLM-based)</h3>
                      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4">
                        {LLM_RAGAS_KEYS.map((k) => (
                          <Kpi key={k} metricKey={k} value={summary.metrics[k]} />
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {summary.by_config.length > 0 && (
                  <Panel
                    title="By configuration"
                    description="Change the live configuration and keep chatting: each distinct configuration accumulates its own real-traffic scores."
                  >
                    <DataTable
                      head={
                        <>
                          <th className={TH}>Configuration</th>
                          <th className={cn(TH, "text-right")}>Questions</th>
                          {["P@5", "R@5", "Ctx prec.", "Ctx rec.", "Faith.", "Ans. rel.", "LLM prec.", "LLM rec."].map(
                            (h) => (
                              <th key={h} className={cn(TH, "text-right")}>
                                {h}
                              </th>
                            ),
                          )}
                        </>
                      }
                    >
                      {summary.by_config.map((g) => {
                        const active = isActive(g);
                        return (
                          <tr
                            key={`${g.config_snapshot.index_fingerprint}:${JSON.stringify(g.config_snapshot.retrieval)}`}
                            className={cn(TR, active && "bg-emerald-50/50 hover:bg-emerald-50")}
                          >
                            <td className={cn(TD, active ? "font-semibold text-gray-900" : "text-gray-700")}>
                              <div className="flex flex-wrap items-center gap-2">
                                {configLabel(g.config_snapshot)}
                                {active && (
                                  <Pill tone="success" className="px-2 py-0.5 text-[11px]">
                                    Active
                                  </Pill>
                                )}
                              </div>
                            </td>
                            <td className={cn(TD, "text-right font-mono tabular-nums text-gray-800")}>{g.count}</td>
                            <Cell v={g.metrics.precision_at_5} warn={false} />
                            <Cell v={g.metrics.recall_at_5} warn={false} />
                            <Cell v={g.metrics.non_llm_context_precision} warn={false} />
                            <Cell v={g.metrics.non_llm_context_recall} warn={false} />
                            {LLM_RAGAS_KEYS.map((k) => (
                              <Cell key={k} v={g.metrics[k]} warn={false} />
                            ))}
                          </tr>
                        );
                      })}
                    </DataTable>
                  </Panel>
                )}

                <Trend items={rows} />
              </div>
            </LoadingOverlay>
            {rows.length > 0 ? (
              <Feed items={rows} />
            ) : (
              <Panel title="Questions customers asked" description="Read from this browser's storage.">
                <p className="text-xs text-gray-500">
                  This browser has not asked a search question yet. The averages above come from everyone&apos;s
                  questions.
                </p>
              </Panel>
            )}
          </div>
        </LoadingOverlay>
      )}
    </div>
  );
}
