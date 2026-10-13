"use client";

import { cn } from "@/app/restaurant/lib/utils";
import { METHOD_COLOR, METHODS } from "@/app/myresume/lib/methods";
import type { Method } from "@/app/myresume/types/api";

const LABEL: Record<Method, string> = { bm25: "BM25", vector: "Vector", hybrid: "Hybrid" };

/** Compact segmented control to pick the retrieval methodology. */
export function MethodToggle({ value, onChange, disabled }: { value: Method; onChange: (m: Method) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Retrieval method" className="inline-flex rounded-lg border border-gray-200 bg-slate-100/80 p-0.5">
      {METHODS.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          disabled={disabled}
          onClick={() => onChange(m)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            value === m && "bg-card font-semibold text-slate-900 shadow-sm",
          )}
        >
          <span className="size-2 rounded-full" style={{ background: METHOD_COLOR[m] }} />
          {LABEL[m]}
        </button>
      ))}
    </div>
  );
}
