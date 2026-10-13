"use client";

import { useMutation } from "@tanstack/react-query";
import { ClipboardCheck, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { errorMessage } from "@/app/restaurant/lib/client";
import { myresume } from "@/app/myresume/lib/endpoints";
import { METHOD_COLOR, METHOD_LABEL } from "@/app/myresume/lib/methods";
import { useLab } from "@/app/myresume/stores/lab-store";
import type { RankingEvaluation } from "@/app/myresume/types/api";

const f2 = (v: number | null) => (v == null ? "n/a" : v.toFixed(2));

function Panel({ title, description, children }: { title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function MetricsTable({ ev }: { ev: RankingEvaluation }) {
  const rows: { label: string; hint: string; value: number | null }[] = [
    { label: `Precision@${ev.k}`, hint: `ranx precision: the share of the ${ev.k} returned jobs that are relevant for this resume.`, value: ev.precision },
    { label: `Recall@${ev.k}`, hint: `ranx recall: the share of all relevant jobs that are among the ${ev.k} returned. It cannot reach 1 when more than ${ev.k} jobs are relevant.`, value: ev.recall },
    { label: `NDCG@${ev.k}`, hint: "ranx ndcg: rank-aware quality. Highly relevant jobs count more than relevant ones and a hit near the top counts more than one near the bottom; 1 is the ideal order.", value: ev.ndcg },
    { label: "MRR", hint: "ranx mrr: 1 divided by the rank of the first relevant job (1 = the first job returned is relevant, 0.5 = the second, ...).", value: ev.mrr },
  ];
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-3 py-2.5 text-left font-medium text-gray-600">Ranking metric (ranx)</th>
            <th className="px-3 py-2.5 text-right font-medium text-gray-600">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-gray-100 last:border-b-0">
              <td className="px-3 py-2.5 text-gray-700" title={r.hint}>{r.label}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-gray-900 tabular-nums">{f2(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ranking quality of the last search (Precision@K, Recall@K, NDCG@K, MRR from ranx). No model is involved. */
export function EvaluationTab() {
  const last = useLab((s) => s.lastMatch);
  const ev = useLab((s) => s.evaluation);
  const setEv = useLab((s) => s.setEvaluation);

  const run = useMutation({
    mutationFn: (m: NonNullable<typeof last>) => myresume.evaluate(m.resumeText, m.response.results.map((r) => r.job_id)),
    onSuccess: setEv,
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-5">
      <Panel
        title="Evaluate last search"
        description="Measures the ranking your last “Find matching jobs” search returned with the method you chose: Precision@K, Recall@K, NDCG@K and MRR, computed with the ranx library. Nothing is searched again and no language model is used."
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button
            type="button"
            size="lg"
            disabled={!last || run.isPending}
            onClick={() => last && run.mutate(last)}
            className="bg-(--brand) text-white hover:bg-(--brand-hover)"
          >
            {run.isPending ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} Evaluate last search
          </Button>
          {last ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block size-2.5 rounded-full" style={{ background: METHOD_COLOR[last.method] }} />
              Last search: <span className="font-semibold">{METHOD_LABEL[last.method]}</span>, Top {last.response.results.length} jobs
            </p>
          ) : (
            <p className="text-xs text-gray-500">Attach your resume and press “Find matching jobs” first: there is no search to evaluate yet.</p>
          )}
        </div>
        {run.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>The evaluation failed</AlertTitle>
            <AlertDescription>{errorMessage(run.error)}</AlertDescription>
          </Alert>
        )}
      </Panel>

      {last && ev && (
        <Panel title="Ranking metrics" description={`Of the Top ${ev.k} jobs of the last search.`}>
          <div className="space-y-4">
            {ev.notices.map((n) => (
              <Alert key={n} variant="info"><Info /><AlertDescription>{n}</AlertDescription></Alert>
            ))}
            <MetricsTable ev={ev} />
            <p className="text-[11px] leading-snug text-gray-400">
              A resume has no hand-labelled answers, so relevance is derived from it: a job is relevant when at least {Math.round(ev.relevant_coverage * 100)}% of its required skills are named in the resume, highly relevant from {Math.round(ev.strong_coverage * 100)}%. That is a yardstick, not ground truth, and as it is keyword based it can favour BM25. Precision, recall and MRR count both levels as relevant; NDCG uses the two grades.
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}
