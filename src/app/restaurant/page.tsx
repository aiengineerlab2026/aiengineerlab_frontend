import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandSwitcher } from "@/app/restaurant/components/brand-switcher";
import { ThemeSwitcher } from "@/app/restaurant/components/theme-switcher";
import { GithubIcon } from "@/app/restaurant/components/github-icon";
import { LabPanel } from "@/app/restaurant/components/panel/lab-panel";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";
import { RESTAURANT_GITHUB_URL } from "@/app/restaurant/lib/links";
import { RestaurantSimulator } from "@/app/restaurant/components/simulator/restaurant-simulator";

export const metadata: Metadata = { title: "The Restaurant · AI Engineer Lab" };

export default function RestaurantLabPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className={GLASS_HEADER}>
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" /> AI Engineer Lab
          </Link>
          <span className="text-white/40">/</span>
          <h1 className="text-sm font-semibold text-white">The Restaurant</h1>
          <BrandSwitcher className="ml-auto" />
          <ThemeSwitcher />
          {RESTAURANT_GITHUB_URL && (
            <a
              href={RESTAURANT_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-[transform,background-color] duration-100 hover:translate-y-px hover:bg-white/25 active:translate-y-px focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <GithubIcon className="size-3.5" />
              GitHub
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[2fr_3fr] lg:items-start">
        {/* ~40%: the mobile app being tuned */}
        <section aria-label="Restaurant mobile app simulator" className="lg:sticky lg:top-[4.5rem]">
          <RestaurantSimulator />
        </section>
        {/* ~60%: tuning panel */}
        <section aria-label="Tuning panel" className="min-w-0">
          <LabPanel />
        </section>
      </main>
    </div>
  );
}
