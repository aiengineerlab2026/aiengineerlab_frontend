"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/app/restaurant/components/ui/progress";
import { titleCase } from "@/app/restaurant/lib/format";

/**
 * Where each stage of a live evaluation sits on the 0-100 scale: [from, to, seconds]. The server only reports which
 * stage an item is in (queued -> judging_relevance -> retrieval -> ragas -> ragas_llm -> done), so inside a stage the
 * number creeps from `from` towards `to` (never reaching it) and jumps to the next band when the stage changes. The
 * two LLM stages take most of the time, so they get most of the scale.
 */
const BANDS: Record<string, [from: number, to: number, seconds: number]> = {
  queued: [0, 5, 3],
  judging_relevance: [5, 30, 6],
  retrieval: [30, 45, 3],
  ragas: [45, 55, 3],
  ragas_llm: [55, 99, 20],
};

const STAGE_LABEL: Record<string, string> = {
  queued: "Queued",
  judging_relevance: "Judging relevance",
  retrieval: "Retrieving",
  ragas: "Scoring context",
  ragas_llm: "Scoring answers with the LLM",
};
const stageLabel = (stage: string) => STAGE_LABEL[stage] ?? titleCase(stage);

/** The percentage after `elapsed` seconds in `stage` (1 to 99 while it is being scored). */
export function scoringPercent(stage: string, elapsed: number): number {
  const [from, to, seconds] = BANDS[stage] ?? BANDS.queued;
  const pct = from + (to - 1 - from) * (1 - Math.exp(-elapsed / seconds));
  return Math.min(99, Math.max(1, Math.floor(pct)));
}

/** The live percentage of an item in `stage`; its clock restarts when the stage changes. */
function useScoringPercent(stage: string): number {
  const [state, setState] = useState({ stage, elapsed: 0 });
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setState({ stage, elapsed: (Date.now() - start) / 1000 }), 400);
    return () => clearInterval(timer);
  }, [stage]);
  return scoringPercent(stage, state.stage === stage ? state.elapsed : 0);
}

/** Just the number ("38%"), for inline use. */
export function ScoringPercent({ stage }: { stage: string }) {
  return <span className="tabular-nums">{useScoringPercent(stage)}%</span>;
}

/** Small percentage and bar for a table row. */
export function ScoringProgress({ stage }: { stage: string }) {
  const percent = useScoringPercent(stage);
  return (
    <Progress value={percent} aria-label="Evaluation progress" className="w-28 flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="truncate">{stageLabel(stage)}</span>
        <span className="font-semibold text-slate-700 tabular-nums">{percent}%</span>
      </div>
    </Progress>
  );
}

/** The prominent one, in the Evaluation card next to the Evaluate button: which question, which stage, how far. */
export function EvaluationProgress({ question, stage }: { question: string; stage: string }) {
  const percent = useScoringPercent(stage);
  return (
    <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-xs text-slate-600" title={question}>
          Evaluating “{question}” · {stageLabel(stage)}
        </span>
        <span className="text-xl font-semibold text-emerald-700 tabular-nums">{percent}%</span>
      </div>
      <Progress value={percent} aria-label="Evaluation progress" className="mt-2" />
    </div>
  );
}
