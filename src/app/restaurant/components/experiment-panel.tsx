"use client";

import { ChevronDown, FlaskConical } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/app/restaurant/lib/utils";

export interface ExperimentStep {
  name: string;
  text: string;
}

export interface ExperimentContent {
  title: string;
  /** Plain text and <strong> only. */
  target: React.ReactNode;
  steps: ExperimentStep[];
  /** What separates a step's bold name from its text, e.g. " — " or ": ". */
  stepSeparator?: string;
  outcome: React.ReactNode;
}

// Every colour comes from the active theme (--brand, set by html[data-brand] = green / blue / red) mixed into the card
// colour, so the banner follows the theme switch and the light / dark mode without any per-theme class.
const TINT = "bg-[color-mix(in_srgb,var(--brand)_6%,var(--card))]";
const LINE = "border-[color-mix(in_srgb,var(--brand)_20%,var(--border))]";
const ACCENT_TEXT = "text-(--brand) dark:text-(--brand-bright)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 py-4 first:pt-0 last:pb-0">
      <h3 className={cn("text-[11px] font-bold tracking-wider uppercase", ACCENT_TEXT)}>{title}</h3>
      {children}
    </div>
  );
}

/** The experiment a lab runs, as a collapsible info card at the top of its page: title, target, steps and expected outcome. */
export function ExperimentPanel({ title, target, steps, stepSeparator = " — ", outcome }: ExperimentContent) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  return (
    <section
      aria-label="About this experiment"
      className={cn("overflow-hidden rounded-xl border border-l-4 border-l-(--brand) shadow-xs", TINT, LINE)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none focus-visible:ring-inset sm:px-5"
      >
        <span
          aria-hidden
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border bg-(--brand)/10", LINE, ACCENT_TEXT)}
        >
          <FlaskConical className="size-5" />
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className={cn("inline-flex rounded-full border px-2 py-px text-[10px] font-bold tracking-wider uppercase", LINE, ACCENT_TEXT)}>
            Experiment
          </span>
          <span className="block text-base leading-snug font-bold text-slate-900 sm:text-lg">
            {title}
          </span>
        </span>
        <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-slate-500 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={bodyId}
          className={cn("divide-y border-t px-4 py-4 sm:px-5 [&_strong]:font-bold [&_strong]:text-slate-900", LINE, "divide-[color-mix(in_srgb,var(--brand)_20%,var(--border))]")}
        >
          <Section title="Target">
            <p className="text-[15px] leading-relaxed text-slate-800">{target}</p>
          </Section>

          <Section title="Experiment Steps">
            <ol className="space-y-2.5">
              {steps.map((s, i) => (
                <li key={s.name} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-800">
                  <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-(--brand) text-xs font-bold text-white tabular-nums">
                    {i + 1}
                  </span>
                  <span>
                    <strong>{s.name}</strong>
                    {stepSeparator}
                    {s.text}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Expected Outcome">
            <p className="text-[15px] leading-relaxed text-slate-800">{outcome}</p>
          </Section>
        </div>
      )}
    </section>
  );
}
