import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeaderControls } from "@/app/restaurant/components/header-controls";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";
import { Analyzer } from "@/app/country-matcher/components/analyzer";
import { EvaluationDashboard } from "@/app/country-matcher/components/evaluation-dashboard";
import { IndexedImages } from "@/app/country-matcher/components/indexed-images";
import { Intro } from "@/app/country-matcher/components/intro";

export const metadata: Metadata = {
  title: "Country Matcher · AI Engineer Lab",
  description: "Can AI recognize a country from its streets? Compare CLIP and ResNet50 image retrieval.",
};

export default function CountryMatcherPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className={GLASS_HEADER}>
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:gap-4 sm:px-6">
          <Link
            href="/"
            aria-label="Back to AI Engineer Lab"
            className="flex shrink-0 items-center gap-1.5 text-sm text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-5 sm:size-4" /> <span className="hidden sm:inline">AI Engineer Lab</span>
          </Link>
          <span className="hidden text-white/40 sm:inline">/</span>
          <h1 className="min-w-0 truncate text-sm font-semibold text-white">Country Matcher</h1>
          <HeaderControls className="ml-auto" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-6 sm:px-6">
        <Intro />
        <Analyzer aside={<IndexedImages />} below={<EvaluationDashboard />} />
      </main>
    </div>
  );
}
