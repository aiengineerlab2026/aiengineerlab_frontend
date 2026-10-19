import { Globe } from "lucide-react";

/** Section A. */
export function Intro() {
  return (
    <section
      aria-label="About this experiment"
      className="flex items-start gap-3.5 rounded-xl border border-l-4 border-gray-200 border-l-(--brand) bg-[color-mix(in_srgb,var(--brand)_6%,var(--card))] px-4 py-4 shadow-xs sm:px-5"
    >
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-(--brand)/20 bg-(--brand)/10 text-(--brand)">
        <Globe className="size-6" />
      </span>
      <div className="min-w-0 space-y-1">
        <span className="inline-flex rounded-full border border-(--brand)/25 px-2 py-px text-[10px] font-bold tracking-wider text-(--brand) uppercase">Experiment</span>
        <h2 className="text-xl leading-tight font-bold text-slate-900 sm:text-2xl">Country Matcher</h2>
        <p className="text-sm text-gray-600 sm:text-base">Can AI recognize a country from its streets? Compare CLIP and ResNet50 image retrieval.</p>
      </div>
    </section>
  );
}
