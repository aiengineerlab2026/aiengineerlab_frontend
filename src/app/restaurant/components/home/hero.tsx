import { FlaskConical } from "lucide-react";
import { BrandSwitcher } from "@/app/restaurant/components/brand-switcher";
import { ThemeSwitcher } from "@/app/restaurant/components/theme-switcher";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";

/** Sticky top navigation header: brand, a live tag and a one-line helper text. */
export function Hero() {
  return (
    <header className={`${GLASS_HEADER} px-6 py-3`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-white"
        >
          <FlaskConical className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white">AI Engineer Lab</h1>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
              AI mini applications
            </span>
          </div>
          <p className="text-sm text-white/90">Explore different AI engineering concepts and features.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <BrandSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
