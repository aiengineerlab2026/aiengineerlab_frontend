"use client";

import { useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLabStore } from "@/app/restaurant/stores/lab-store";
import { cn } from "@/app/restaurant/lib/utils";

const DESKTOP = "(min-width: 1024px)";

/**
 * Wraps the tuning panel. From `lg` up it is just the right-hand column.
 * Below that it becomes a bottom sheet over the page, opened from a floating button at the bottom right.
 * The same element is used in both modes (CSS only), so the panel is mounted once and keeps its unsaved edits.
 */
export function LabPanelSheet({ children }: { children: React.ReactNode }) {
  const open = useLabStore((s) => s.panelOpen);
  const setOpen = useLabStore((s) => s.setPanelOpen);

  // While the sheet is showing: lock page scroll behind it, close on Escape, and release everything on desktop.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(DESKTOP);
    const sync = () => {
      document.body.style.overflow = mq.matches ? "" : "hidden";
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mq.matches) setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      mq.removeEventListener("change", sync);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the lab panel: configuration, retrieval inspector and evaluation"
        className={cn(
          "fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-(--brand) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 transition-[transform,background-color] duration-100 hover:bg-(--brand-hover) active:translate-y-px focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden",
          open && "hidden",
        )}
      >
        <SlidersHorizontal className="size-4" /> Lab
      </button>

      {open && <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

      <section
        aria-label="Tuning panel"
        className={cn(
          "min-w-0",
          "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[90dvh] max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:rounded-t-2xl max-lg:border-t max-lg:bg-background max-lg:px-4 max-lg:pb-6 max-lg:shadow-2xl max-lg:transition-[transform,visibility] max-lg:duration-300",
          !open && "max-lg:invisible max-lg:translate-y-full",
        )}
      >
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between border-b bg-background px-4 py-3 lg:hidden">
          <h2 className="text-sm font-semibold">Lab panel</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close the lab panel"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </section>
    </>
  );
}
