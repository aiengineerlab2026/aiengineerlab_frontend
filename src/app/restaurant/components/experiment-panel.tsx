import { FlaskConical } from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";

// Every colour comes from the active theme (--brand, set by html[data-brand] = green / blue / red) mixed into the card
// colour, so the banner follows the theme switch and the light / dark mode without any per-theme class.
const TINT = "bg-[color-mix(in_srgb,var(--brand)_6%,var(--card))]";
const LINE = "border-[color-mix(in_srgb,var(--brand)_20%,var(--border))]";
const ACCENT_TEXT = "text-(--brand) dark:text-(--brand-bright)";

/** The experiment a lab runs, as a title banner at the top of its page. */
export function ExperimentPanel({ title }: { title: string }) {
  return (
    <section
      aria-label="About this experiment"
      className={cn("flex items-center gap-3.5 rounded-xl border border-l-4 border-l-(--brand) px-4 py-3.5 shadow-xs sm:px-5", TINT, LINE)}
    >
      <span
        aria-hidden
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border bg-(--brand)/10", LINE, ACCENT_TEXT)}
      >
        <FlaskConical className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <span className={cn("inline-flex rounded-full border px-2 py-px text-[10px] font-bold tracking-wider uppercase", LINE, ACCENT_TEXT)}>
          Experiment
        </span>
        <h2 className="text-base leading-snug font-bold text-slate-900 sm:text-lg">{title}</h2>
      </div>
    </section>
  );
}
