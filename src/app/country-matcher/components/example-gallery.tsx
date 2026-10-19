"use client";

import { cn } from "@/app/restaurant/lib/utils";
import type { Example } from "@/app/country-matcher/types/api";

/** Held-out photos that are not in the searchable dataset: their label is hidden until the result is shown. */
export function ExampleGallery({
  examples,
  selectedId,
  disabled,
  onPick,
}: {
  examples: Example[];
  selectedId: string | null;
  disabled?: boolean;
  onPick: (example: Example) => void;
}) {
  if (examples.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-700">
        Or try an example <span className="font-normal text-gray-500">(photos the models have never indexed; the country is revealed with the result)</span>
      </p>
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-5">
        {examples.map((e, i) => (
          <li key={e.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(e)}
              aria-pressed={selectedId === e.id}
              aria-label={`Use example photo ${i + 1}`}
              className={cn(
                "block aspect-square w-full cursor-pointer overflow-hidden rounded-lg border-2 bg-slate-100 transition-[border-color,opacity] focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                selectedId === e.id ? "border-(--brand)" : "border-transparent hover:border-gray-300",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote, short-lived signed URLs */}
              <img src={e.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
