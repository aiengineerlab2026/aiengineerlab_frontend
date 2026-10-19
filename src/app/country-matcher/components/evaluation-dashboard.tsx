"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { errorMessage } from "@/app/restaurant/lib/client";
import { cn } from "@/app/restaurant/lib/utils";
import { useEvaluation } from "@/app/country-matcher/hooks/use-country-matcher";
import { MODEL_COLOR, MODEL_LABEL, metricRows, winner } from "@/app/country-matcher/lib/format";
import { MODEL_IDS, type EvaluationResults } from "@/app/country-matcher/types/api";

function RetrievalTable({ results }: { results: EvaluationResults }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-card">
      <table className="w-full min-w-[28rem] text-sm">
        <thead className="bg-slate-50 text-xs text-gray-600">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold">Retrieval</th>
            {MODEL_IDS.map((m) => (
              <th key={m} scope="col" className="px-3 py-2 text-right font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: MODEL_COLOR[m] }} />
                  {MODEL_LABEL[m]}
                </span>
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-right font-semibold">Better</th>
          </tr>
        </thead>
        <tbody>
          {metricRows(results.k).map((row) => {
            const [a, b] = MODEL_IDS.map((m) => row.value(results.models[m]));
            const win = winner(row, a, b); // decided only from the stored numbers
            return (
              <tr key={row.key} className="border-t border-gray-100">
                <th scope="row" className="px-3 py-2 text-left font-medium text-gray-800">{row.label}</th>
                {MODEL_IDS.map((m, i) => {
                  const v = i === 0 ? a : b;
                  return (
                    <td key={m} className={cn("px-3 py-2 text-right tabular-nums", win === m ? "font-bold text-gray-900" : "text-gray-700")}>
                      <span className="inline-flex items-center justify-end gap-1.5">
                        {win === m && <CheckCircle2 aria-label="better on this metric" className="size-3.5 text-green-600" />}
                        {v === null ? "n/a" : row.format(v)}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right text-xs text-gray-600">{win === null ? "" : win === "tie" ? "tie" : MODEL_LABEL[win]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The stored retrieval evaluation. Hidden until the first analysis finishes, then reloaded after every analysis (``runs``). */
export function EvaluationDashboard({ runs }: { runs: number }) {
  const query = useEvaluation(runs);
  const results = query.data?.results;
  if (runs === 0) return null;

  return (
    <section aria-label="Retrieval evaluation">
      {query.isFetching && !query.data && <Skeleton className="h-40 w-full" />}
      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Couldn&apos;t load the evaluation</AlertTitle>
          <AlertDescription>{errorMessage(query.error)}</AlertDescription>
        </Alert>
      )}
      {query.data && !results && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-card p-6 text-center text-sm text-gray-500">No evaluation results yet.</p>
      )}
      {results && <RetrievalTable results={results} />}
    </section>
  );
}
