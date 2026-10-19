"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/app/restaurant/components/ui/alert";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { MODEL_LABEL } from "@/app/country-matcher/lib/format";
import { MODEL_IDS, type AnalysisResult } from "@/app/country-matcher/types/api";
import { PredictionCard } from "./prediction-card";

/** What the two models said, stated plainly. Only describes agreement: it never ranks the models. */
function agreement(result: AnalysisResult): string | null {
  const both = MODEL_IDS.map((m) => result.predictions[m]);
  if (!both[0] || !both[1]) return null;
  const [a, b] = both;
  return a.country.country_code === b.country.country_code
    ? `Both models estimate ${a.country.country_name}.`
    : `The models disagree: ${MODEL_LABEL.clip} estimates ${a.country.country_name}, ${MODEL_LABEL.resnet50} estimates ${b.country.country_name}.`;
}

export function ResultsSkeleton({ count }: { count: number }) {
  return (
    <div aria-busy="true" aria-label="Analyzing the image" className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-4 rounded-xl border border-gray-200 bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, j) => (
              <Skeleton key={j} className="aspect-[4/3] w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One card per model, stacked: the results sit in a half-width column beside the evaluation on desktop. */
export function Results({ result }: { result: AnalysisResult }) {
  const cards = MODEL_IDS.flatMap((m) => (result.predictions[m] ? [result.predictions[m]] : []));
  const note = agreement(result);
  return (
    <section aria-label="Results" aria-live="polite" className="space-y-3">
      {note && (
        <Alert variant="info">
          <Info />
          <AlertDescription>{note} Agreement says nothing about which model is right: see the evaluation for measured results.</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4">
        {cards.map((p) => (
          <PredictionCard key={p.model} prediction={p} query={result.query} />
        ))}
      </div>
    </section>
  );
}
