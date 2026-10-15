"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";

/**
 * Covers values that are about to change, so nobody reads or compares stale numbers.
 * The old content stays faintly visible underneath and cannot be interacted with while loading.
 */
export function LoadingOverlay({
  loading,
  label = "Updating…",
  className,
  children,
}: {
  loading: boolean;
  label?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)} aria-busy={loading}>
      <div className={cn("transition-opacity", loading && "pointer-events-none opacity-40 select-none")} inert={loading}>
        {children}
      </div>
      {loading && (
        <div role="status" className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-background/50 backdrop-blur-[1px]">
          <span className="sticky top-16 mt-6 flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
            <Loader2 className="size-3.5 animate-spin text-brand" /> {label}
          </span>
        </div>
      )}
    </div>
  );
}
