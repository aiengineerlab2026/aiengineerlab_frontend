"use client";

import { Info } from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";
import { useUploadUsage, useVectorUsage } from "@/app/myresume/hooks/use-myresume";
import type { LimitUsage } from "@/app/myresume/types/api";

function resetIn(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${Math.max(1, m)} min`;
}

/** A window this long is a total cap: the budget never comes back, so no reset time is shown. */
const TOTAL_WINDOW_SECONDS = 30 * 86400;

/** Says how many uses of a capped action are left (the server enforces the limit). `rule` words the cap, e.g. “You can upload 3 resumes.” */
function LimitNote({ rule, usage, className }: { rule: (limit: number) => string; usage: LimitUsage | undefined; className?: string }) {
  if (!usage || usage.limit === 0) return null;
  const total = usage.window_seconds >= TOTAL_WINDOW_SECONDS;
  const exhausted = usage.remaining === 0;
  const text = rule(usage.limit);
  return (
    <p className={cn("inline-flex items-start gap-1.5 text-[11px] leading-snug", exhausted ? "text-amber-700" : "text-gray-500", className)}>
      <Info className="mt-px size-3 shrink-0" />
      <span>
        {exhausted
          ? `Limit reached: ${text}${total ? "" : ` It resets in ${resetIn(usage.reset_in_seconds)}.`}`
          : `${text} ${usage.remaining} left.`}
      </span>
    </p>
  );
}

export function UploadLimitNote({ className }: { className?: string }) {
  return <LimitNote rule={(n) => `You can upload ${n} resumes to test.`} usage={useUploadUsage().data} className={className} />;
}

export function VectorLimitNote({ className }: { className?: string }) {
  return <LimitNote rule={(n) => `Vector search can be used ${n} times.`} usage={useVectorUsage().data} className={className} />;
}
