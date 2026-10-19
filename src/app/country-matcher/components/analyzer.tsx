"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Database, Loader2, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { errorMessage } from "@/app/restaurant/lib/client";
import { cn } from "@/app/restaurant/lib/utils";
import { useAnalyze, useExamples, useModels } from "@/app/country-matcher/hooks/use-country-matcher";
import type { QueryImage } from "@/app/country-matcher/lib/endpoints";
import type { Example } from "@/app/country-matcher/types/api";
import { ExampleGallery } from "./example-gallery";
import { Results, ResultsSkeleton } from "./results";
import { UploadZone } from "./upload-zone";

interface Selected {
  image: QueryImage;
  previewUrl: string;
  label: string;
}

const KS = [3, 5, 10];
function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; title?: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-gray-200 bg-slate-100/80 p-0.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            title={o.title}
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              value === o.id && "bg-card font-semibold text-slate-900 shadow-sm",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Sections B to D: choose a photo, analyze it with both models and read the side-by-side results. */
/** ``aside`` is shown beside the upload section on desktop and below it on mobile. */
export function Analyzer({ aside }: { aside?: ReactNode }) {
  const models = useModels();
  const ready = models.data?.ready ?? false;
  const examples = useExamples(ready);
  const analyze = useAnalyze();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [k, setK] = useState<number | null>(null);
  const effectiveK = k ?? models.data?.default_k ?? 5;

  // Object URLs of chosen files are released when replaced and when the page is left.
  useEffect(() => {
    const url = selected?.image.kind === "file" ? selected.previewUrl : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [selected]);

  const choose = (next: Selected | null) => {
    setSelected(next);
    analyze.reset(); // results of another image would be misleading next to the new preview
  };

  const onFile = (file: File) => choose({ image: { kind: "file", file }, previewUrl: URL.createObjectURL(file), label: file.name });
  const onExample = (e: Example) => choose({ image: { kind: "example", id: e.id }, previewUrl: e.url, label: "Example photo" });

  const run = () => {
    if (!selected) return;
    analyze.mutate(
      { image: selected.image, choice: "both", k: effectiveK, aggregation: "weighted" },
      { onError: (e) => toast.error(errorMessage(e)) },
    );
  };

  const maxMb = models.data?.max_upload_mb ?? 8;
  const selectedExample = selected?.image.kind === "example" ? selected.image.id : null;

  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section aria-labelledby="cm-upload" className="space-y-4 rounded-xl border border-gray-200 bg-card p-4 shadow-xs sm:p-5">
          <h2 id="cm-upload" className="text-base font-semibold text-gray-900">1. Choose a photo</h2>

          {models.isError && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Couldn&apos;t load Country Matcher</AlertTitle>
              <AlertDescription>{errorMessage(models.error)}</AlertDescription>
            </Alert>
          )}
          {models.data && !ready && (
            <Alert variant="info">
              <Database />
              <AlertTitle>The reference dataset isn&apos;t indexed yet</AlertTitle>
              <AlertDescription>
                There are no labeled images to compare against, so predictions are switched off. Once the dataset has been ingested and embedded, this page will work
                without any change.
              </AlertDescription>
            </Alert>
          )}

          <UploadZone
            previewUrl={selected?.previewUrl ?? null}
            label={selected?.label ?? null}
            maxMb={maxMb}
            disabled={analyze.isPending || !ready}
            onFile={onFile}
            onError={(m) => toast.error(m)}
            onClear={() => choose(null)}
          />
          <ExampleGallery
            examples={examples.data?.examples ?? []}
            selectedId={selectedExample}
            disabled={analyze.isPending}
            onPick={onExample}
          />
        </section>
        <div className="space-y-5">
          <section aria-labelledby="cm-model" className="space-y-4 rounded-xl border border-gray-200 bg-card p-4 shadow-xs sm:p-5">
            <h2 id="cm-model" className="text-base font-semibold text-gray-900">Config</h2>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Segmented
                label="Closest images (K)"
                value={effectiveK}
                options={[...new Set([...KS, effectiveK])].sort((a, b) => a - b).map((n) => ({ id: n, label: String(n) }))}
                onChange={setK}
                disabled={analyze.isPending}
              />
              <Button
                type="button"
                size="lg"
                disabled={!selected || !ready || analyze.isPending}
                onClick={run}
                className="ml-auto h-10 bg-(--brand) px-5 text-white hover:bg-(--brand-hover)"
              >
                {analyze.isPending ? <Loader2 className="animate-spin" /> : <ScanSearch />}
                {analyze.isPending ? "Analyzing…" : "Analyze"}
              </Button>
            </div>
            {!selected && ready && <p className="text-xs text-gray-500">Choose a photo or an example to enable Analyze.</p>}
          </section>
          {aside}
        </div>
      </div>

      {analyze.isPending && (
        <>
          <p className="text-center text-xs text-gray-500">The first request after the server wakes up can take a few seconds while the models load.</p>
          <ResultsSkeleton count={2} />
        </>
      )}
      {analyze.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Couldn&apos;t analyze this photo</AlertTitle>
          <AlertDescription>{errorMessage(analyze.error)}</AlertDescription>
        </Alert>
      )}
      {analyze.data && <Results result={analyze.data} />}
    </div>
  );
}
