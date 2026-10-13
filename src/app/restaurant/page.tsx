import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExperimentPanel } from "@/app/restaurant/components/experiment-panel";
import { HeaderControls } from "@/app/restaurant/components/header-controls";
import { GithubIcon } from "@/app/restaurant/components/github-icon";
import { LabPanel } from "@/app/restaurant/components/panel/lab-panel";
import { LabPanelSheet } from "@/app/restaurant/components/panel/lab-panel-sheet";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";
import { RESTAURANT_GITHUB_URL } from "@/app/restaurant/lib/links";
import { RestaurantSimulator } from "@/app/restaurant/components/simulator/restaurant-simulator";

export const metadata: Metadata = { title: "The Restaurant · AI Engineer Lab" };

const EXPERIMENT = {
  title: "RAG Retrieval Strategies: Compare and Evaluate",
  target: (
    <>
      Explore how different retrieval strategies—<strong>Vector Search, Multi-Query Retrieval, and Hybrid Search</strong>—affect RAG performance. Use <strong>RAGAS evaluation metrics</strong> to compare retrieval quality and AI-generated responses.
    </>
  ),
  stepSeparator: ": ",
  steps: [
    { name: "Vector Search", text: "Select Vector Search, ask the restaurant chatbot a food-related question, and review the RAGAS evaluation results." },
    { name: "Multi-Query Retrieval", text: "Switch to Multi-Query, ask the same question, and observe how generating multiple queries affects the evaluation scores." },
    { name: "Hybrid Search", text: "Select Hybrid Search (Vector + BM25 + RRF), repeat the same question, and review its RAGAS scores." },
    { name: "Compare Results", text: "Compare Context Precision, Context Recall, Faithfulness, and Answer Relevancy across all three strategies to identify which performs best." },
  ],
  outcome: "Understand how retrieval strategy selection influences the relevance of retrieved information and the quality of RAG-generated answers.",
};

export default function RestaurantLabPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className={GLASS_HEADER}>
        <div className="mx-auto flex max-w-[1500px] items-center gap-2.5 px-4 py-3 sm:gap-4 sm:px-6">
          <Link
            href="/"
            aria-label="Back to AI Engineer Lab"
            className="flex shrink-0 items-center gap-1.5 text-sm text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-5 sm:size-4" /> <span className="hidden sm:inline">AI Engineer Lab</span>
          </Link>
          <span className="hidden text-white/40 sm:inline">/</span>
          <h1 className="min-w-0 truncate text-sm font-semibold text-white">The Restaurant</h1>
          <HeaderControls className="ml-auto" />
          {RESTAURANT_GITHUB_URL && (
            <a
              href={RESTAURANT_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex size-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/15 text-xs font-semibold text-white backdrop-blur-sm sm:size-auto sm:px-3 sm:py-1.5 transition-[transform,background-color] duration-100 hover:translate-y-px hover:bg-white/25 active:translate-y-px focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <GithubIcon className="size-4 sm:size-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 px-4 py-6 sm:px-6">
        <ExperimentPanel {...EXPERIMENT} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          {/* ~40%: the mobile app being tuned */}
          <section aria-label="Restaurant mobile app simulator" className="min-w-0 lg:sticky lg:top-[4.5rem]">
            <RestaurantSimulator />
          </section>
          {/* ~60%: tuning panel (a bottom sheet opened from a floating button on phones) */}
          <LabPanelSheet>
            <LabPanel />
          </LabPanelSheet>
        </div>
      </main>
    </div>
  );
}
