import Link from "next/link";
import { FlaskConical, Newspaper } from "lucide-react";
import { HeaderControls } from "@/app/restaurant/components/header-controls";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";

/**
 * Sticky top navigation header: brand, a live tag and a one-line helper text.
 * Phones get a compact first row (logo, title, switchers) with the helper text on its own row underneath;
 * from `sm` up the helper text sits under the title and the switchers span both rows.
 */
export function Hero() {
  return (
    <header className={`${GLASS_HEADER} px-4 py-3 sm:px-6`}>
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-white sm:row-span-2"
        >
          <FlaskConical className="size-5" />
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap text-white sm:text-xl">AI Engineer Lab</h1>
          <span className="hidden items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white sm:inline-flex">
            AI mini applications
          </span>
        </div>
        <div className="flex items-center gap-3 sm:row-span-2">
          <Link
            href="/articles"
            aria-label="Articles"
            className="inline-flex size-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/15 text-xs font-semibold text-white backdrop-blur-sm transition-[transform,background-color] duration-100 hover:translate-y-px hover:bg-white/25 active:translate-y-px focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none sm:size-auto sm:px-3 sm:py-1.5"
          >
            <Newspaper className="size-4 sm:size-3.5" />
            <span className="hidden sm:inline">Articles</span>
          </Link>
          <HeaderControls />
        </div>
        <p className="col-span-3 text-xs text-white/90 sm:col-span-1 sm:col-start-2 sm:text-sm">
          Explore different AI engineering concepts and features.
        </p>
      </div>
    </header>
  );
}
