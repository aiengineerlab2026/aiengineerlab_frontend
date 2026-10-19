"use client";

import { CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/restaurant/components/ui/tooltip";
import { cn } from "@/app/restaurant/lib/utils";
import { flag, MODEL_COLOR, MODEL_LABEL, ms, pct } from "@/app/country-matcher/lib/format";
import type { Prediction, QueryInfo } from "@/app/country-matcher/types/api";
import { MatchImage } from "./match-image";

/** One model's answer: the country, how strongly its neighbours agree, the evidence and the reason. */
export function PredictionCard({ prediction: p, query }: { prediction: Prediction; query: QueryInfo }) {
  const actual = query.actual_country_code;
  const right = actual ? actual === p.country.country_code : null;
  return (
    <article aria-label={`${MODEL_LABEL[p.model]} result`} className="min-w-0 space-y-4 rounded-xl border border-gray-200 bg-card p-4 shadow-xs sm:p-5">
      <header className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: MODEL_COLOR[p.model] }} />
          {MODEL_LABEL[p.model]}
        </h3>
        <span className="truncate text-[11px] text-gray-500" title={`${p.model_name} @ ${p.model_version}`}>
          {p.dimension}-d · {p.model_version}
        </span>
      </header>

      <div>
        <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Estimated country</p>
        <p className="mt-0.5 flex items-center gap-2 text-2xl leading-tight font-bold text-gray-900">
          <span aria-hidden>{flag(p.country.country_code)}</span>
          {p.country.country_name}
        </p>
        {right !== null && (
          <p className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium", right ? "text-green-700" : "text-red-700")}>
            {right ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            Actual label of this example: {query.actual_country_name}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
            Country support score
            <Tooltip>
              <TooltipTrigger render={<button type="button" aria-label="What is the support score?" className="cursor-help text-gray-400 hover:text-gray-600" />}>
                <Info className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64">{p.support_note}</TooltipContent>
            </Tooltip>
          </span>
          <span className="font-semibold text-gray-900 tabular-nums">{pct(p.country.support)}</span>
        </div>
        <div
          role="meter"
          aria-label="Country support score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p.country.support * 100)}
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
        >
          <div className="h-full rounded-full" style={{ width: pct(p.country.support), background: MODEL_COLOR[p.model] }} />
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Agreement among the {p.neighbors.length} closest images ({p.aggregation === "weighted" ? "similarity-weighted vote" : "majority vote"}). Not a probability.
        </p>
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-gray-700">{p.explanation}</p>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Countries among the closest images</p>
        <ul className="flex flex-wrap gap-1.5">
          {p.ranking.map((c) => (
            <li key={c.country_code} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
              {flag(c.country_code)} {c.country_name} · {c.votes} {c.votes === 1 ? "image" : "images"} · {pct(c.support)}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Top {p.neighbors.length} closest labeled images (cosine similarity)</p>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {p.neighbors.map((n) => (
            <li key={n.image.id}>
              <MatchImage neighbor={n} />
            </li>
          ))}
        </ol>
      </div>

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {ms(p.timings.total_ms)} total</span>
        <span>embedding {ms(p.timings.embed_ms)}</span>
        <span>search {ms(p.timings.search_ms)}</span>
      </footer>
    </article>
  );
}
