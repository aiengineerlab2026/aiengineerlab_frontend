"use client";

import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";
import { METHOD_COLOR, PERCENT_NOTE } from "@/app/myresume/lib/methods";
import type { MatchedJob, Method } from "@/app/myresume/types/api";
import { JobTitleButton } from "./job-dialog";

function ScoreCell({ label, value, rank, color, strong }: { label: string; value: string; rank?: number | null; color: string; strong?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-lg border px-2.5 py-1.5", strong ? "border-gray-300 bg-gray-50" : "border-gray-200")}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-gray-500 uppercase">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
        {rank != null && <span className="ml-auto text-gray-400 normal-case">#{rank}</span>}
      </div>
      <div className={cn("mt-0.5 text-sm tabular-nums", strong ? "font-bold text-gray-900" : "font-semibold text-gray-700")}>{value}</div>
    </div>
  );
}

/** The scores that produced this position: the final one, and for hybrid both retrievers' own scores next to the fused RRF score. */
function Scores({ m, method }: { m: MatchedJob; method: Method }) {
  const bm25 = m.bm25_score != null ? m.bm25_score.toFixed(2) : "n/a";
  const vec = m.vector_score != null ? m.vector_score.toFixed(3) : "n/a";
  if (method === "bm25") return <div className="grid grid-cols-1"><ScoreCell label="BM25" value={bm25} color={METHOD_COLOR.bm25} strong /></div>;
  if (method === "vector") return <div className="grid grid-cols-1"><ScoreCell label="Cosine similarity" value={vec} color={METHOD_COLOR.vector} strong /></div>;
  return (
    <div className="grid grid-cols-3 gap-2">
      <ScoreCell label="RRF" value={(m.rrf_score ?? 0).toFixed(4)} color={METHOD_COLOR.hybrid} strong />
      <ScoreCell label="BM25" value={bm25} rank={m.bm25_rank} color={METHOD_COLOR.bm25} />
      <ScoreCell label="Vector" value={vec} rank={m.vector_rank} color={METHOD_COLOR.vector} />
    </div>
  );
}

/** One retrieved job: its rank, match percentage and the scores that produced the position, the summary and the required skills (green = named in the resume). */
export function JobCard({ match, method, resumeText }: { match: MatchedJob; method: Method; resumeText: string }) {
  const { job } = match;
  const haystack = resumeText.toLowerCase();

  return (
    <li className="rounded-xl border border-gray-200 bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-(--brand) text-xs font-bold text-white">
          {match.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900"><JobTitleButton job={job} /></h3>
            <span className="shrink-0 text-base leading-none font-bold text-(--brand) tabular-nums" title={PERCENT_NOTE[method]}>{match.match_percent}%</span>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{job.company}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{job.location} · {job.work_mode}</span>
            <span>{job.level}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100" role="meter" aria-valuenow={match.match_percent} aria-valuemin={0} aria-valuemax={100} aria-label="Match percentage">
        <div className="h-full rounded-full bg-(--brand)" style={{ width: `${match.match_percent}%` }} />
      </div>
      <div className="mt-3"><Scores m={match} method={method} /></div>
      <p className="mt-3 text-xs leading-relaxed text-gray-600">{job.summary}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Required skills">
        {job.skills.map((s) => {
          const has = haystack.includes(s.toLowerCase());
          return (
            <li
              key={s}
              title={has ? "Mentioned in your resume" : undefined}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                has ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600",
              )}
            >
              {has && <CheckCircle2 className="size-3" />}
              {s}
            </li>
          );
        })}
      </ul>
    </li>
  );
}
