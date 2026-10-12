/** Frosted-glass top bar shared by the home page and the project pages: translucent gradient in the active brand color (see globals.css), blurred, hairline highlight. */
export const GLASS_HEADER =
  "sticky top-0 z-30 border-b border-white/25 bg-gradient-to-r from-(--brand-glass-from) to-(--brand-glass-to) shadow-lg shadow-(color:--brand-shadow) backdrop-blur-md backdrop-saturate-150 supports-[not(backdrop-filter)]:bg-(--brand-solid)";

/** Square translucent icon button for the glass header (theme toggle, appearance menu, GitHub). */
export const GLASS_BUTTON =
  "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/30 bg-white/15 text-white transition-[transform,background-color] duration-100 hover:translate-y-px hover:bg-white/25 active:translate-y-px focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none";
