"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Info, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { errorMessage } from "@/app/restaurant/lib/client";
import { keys, useChosenEmbedding, useRestoreSettings, useVectorUsage } from "@/app/myresume/hooks/use-myresume";
import { myresume } from "@/app/myresume/lib/endpoints";
import { METHOD_LABEL } from "@/app/myresume/lib/methods";
import { useLab } from "@/app/myresume/stores/lab-store";
import { useSettings } from "@/app/myresume/stores/settings-store";
import type { Method, RetrievalConfig } from "@/app/myresume/types/api";
import { JobCard } from "./job-card";
import { VectorLimitNote } from "./limit-notes";
import { ResumeUpload } from "./resume-upload";
import { MethodToggle } from "./method-toggle";

const MIN_CHARS = 40;

/** The left column: upload a resume, choose the method, read the ranked jobs with their scores. */
export function ResumeMatcher() {
  useRestoreSettings();
  const text = useLab((s) => s.resumeText);
  const setText = useLab((s) => s.setResumeText);
  const setLastMatch = useLab((s) => s.setLastMatch);
  const config = useSettings((s) => s.config);
  const patch = useSettings((s) => s.patch);
  const { embedding } = useChosenEmbedding();
  const qc = useQueryClient();
  const vectorUsage = useVectorUsage().data;
  const match = useMutation({
    mutationFn: (v: { text: string; config: RetrievalConfig }) => myresume.match(v.text, v.config, embedding),
    onSuccess: (response, v) => {
      setLastMatch({ resumeText: v.text, method: v.config.method, response });
    },
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: (_r, _e, v) => {
      if (v.config.method === "vector") void qc.invalidateQueries({ queryKey: keys.vectorUsage });
    },
  });

  const vectorUsed = config.method === "vector" && !!vectorUsage && vectorUsage.limit > 0 && vectorUsage.remaining === 0;
  const tooShort = text.trim().length < MIN_CHARS;
  const run = () => match.mutate({ text, config });
  const data = match.data;
  const stale = data && match.variables && JSON.stringify(match.variables.config) !== JSON.stringify(config);

  // Choosing a method only selects it: nothing is searched until "Find matching jobs" is pressed, and only for that method.
  const changeMethod = (method: Method) => patch({ method });

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-card p-5 shadow-xs">
        <header className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--brand)/10 text-(--brand)"><FileText className="size-5" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Your resume</h2>
            <p className="mt-0.5 text-xs text-gray-500">Attach your resume as a PDF or DOCX and find the best matching jobs out of the job board.</p>
          </div>
        </header>
        <div className="space-y-3">
          <ResumeUpload text={text} onText={setText} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MethodToggle value={config.method} onChange={changeMethod} disabled={match.isPending} />
            <Button type="button" size="lg" disabled={tooShort || vectorUsed || match.isPending} onClick={run} className="bg-(--brand) text-white hover:bg-(--brand-hover)">
              {match.isPending ? <Loader2 className="animate-spin" /> : <Search />} Find matching jobs
            </Button>
          </div>
          <VectorLimitNote />
          {text.length === 0 ? (
            <p className="text-xs text-gray-500">Attach your resume to start.</p>
          ) : (
            tooShort && <p className="text-xs text-gray-500">Not enough text was found in the file (at least {MIN_CHARS} characters are needed).</p>
          )}
        </div>
      </section>

      {match.isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t match this resume</AlertTitle>
          <AlertDescription>{errorMessage(match.error)}</AlertDescription>
        </Alert>
      )}

      {data && (
        <section aria-label="Matching jobs" aria-live="polite" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-sm font-semibold text-gray-900">
              Top {data.results.length} jobs · {METHOD_LABEL[data.method]}
            </h2>
            <p className="text-xs text-gray-500">
              {Math.round(data.latency_ms)} ms{data.embed_ms != null && ` (${Math.round(data.embed_ms)} ms embedding)`}
              {data.query_terms != null && ` · ${data.query_terms} keywords`}
              {data.embedding && ` · ${data.embedding.model}`}
            </p>
          </div>
          {stale && (
            <Alert variant="info">
              <Info />
              <AlertDescription>Settings changed since these results. Run the search again to apply them.</AlertDescription>
            </Alert>
          )}
          {data.notices.map((n) => (
            <Alert key={n} variant="info"><Info /><AlertDescription>{n}</AlertDescription></Alert>
          ))}
          {data.results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No job matched with these settings.</p>
          ) : (
            <ol className="space-y-3">
              {data.results.map((m) => (
                <JobCard key={m.job_id} match={m} method={data.method} resumeText={match.variables?.text ?? text} />
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
