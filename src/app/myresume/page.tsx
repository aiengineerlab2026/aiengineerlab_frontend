import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GithubIcon } from "@/app/restaurant/components/github-icon";
import { ExperimentPanel } from "@/app/restaurant/components/experiment-panel";
import { HeaderControls } from "@/app/restaurant/components/header-controls";
import { LabPanelSheet } from "@/app/restaurant/components/panel/lab-panel-sheet";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";
import { ResumeMatcher } from "@/app/myresume/components/matcher/resume-matcher";
import { MyResumePanel } from "@/app/myresume/components/panel/my-resume-panel";
import { MYRESUME_GITHUB_URL } from "@/app/myresume/lib/links";

export const metadata: Metadata = { title: "My Resume · AI Engineer Lab" };

const EXPERIMENT = {
  title: "BM25 vs Vector Search vs Hybrid: Which Retrieves Better Job Matches?",
  target: (
    <>
      Demonstrate how <strong>BM25 can outperform semantic vector search</strong> when exact keyword matching matters, and explore whether Hybrid Search improves retrieval quality.
    </>
  ),
  steps: [
    { name: "Upload Your Resume", text: "Upload a PDF resume to find matching jobs." },
    { name: "Test Vector Search", text: "Explore jobs retrieved through semantic similarity." },
    { name: "Test BM25", text: "Compare results using keyword-based matching." },
    { name: "Test Hybrid Search", text: "Observe how combining BM25 and Vector Search using RRF affects rankings." },
    { name: "Evaluate Performance", text: "Compare Precision@K, Recall@K, NDCG@K, and retrieval latency across all three methods." },
  ],
  outcome: (
    <>
      Understand the strengths and limitations of each retrieval strategy and discover why <strong>semantic similarity doesn&apos;t always mean better retrieval accuracy</strong>.
    </>
  ),
};

export default function MyResumeLabPage() {
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
          <h1 className="min-w-0 truncate text-sm font-semibold text-white">My Resume</h1>
          <HeaderControls className="ml-auto" />
          {MYRESUME_GITHUB_URL && (
            <a
              href={MYRESUME_GITHUB_URL}
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 lg:items-start">
          <section aria-label="Resume matcher" className="min-w-0">
            <ResumeMatcher />
          </section>
          {/* Tuning panel (a bottom sheet opened from a floating button on phones) */}
          <LabPanelSheet openLabel="Open the lab panel: configuration and evaluation">
            <MyResumePanel />
          </LabPanelSheet>
        </div>
      </main>
    </div>
  );
}
