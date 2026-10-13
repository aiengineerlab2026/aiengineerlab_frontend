import { create } from "zustand";
import type { MatchResponse, Method, RankingEvaluation } from "@/app/myresume/types/api";

export type PanelTab = "configuration" | "evaluation";

/** The last "Find matching jobs" search: the resume, the method that produced it and what it returned. */
export interface LastMatch {
  resumeText: string;
  method: Method;
  response: MatchResponse;
}

interface LabState {
  panelTab: PanelTab;
  setPanelTab: (t: PanelTab) => void;
  /** The resume being matched; lives here so it survives switching tabs. A different resume makes the old search stale. */
  resumeText: string;
  setResumeText: (t: string) => void;
  /** The search "Evaluate last search" measures. */
  lastMatch: LastMatch | null;
  setLastMatch: (m: LastMatch) => void;
  /** The ranx metrics of that search, kept while the page is open so they survive switching tabs; cleared when a new search arrives. */
  evaluation: RankingEvaluation | null;
  setEvaluation: (e: RankingEvaluation | null) => void;
}

export const useLab = create<LabState>((set) => ({
  panelTab: "configuration",
  setPanelTab: (panelTab) => set({ panelTab }),
  resumeText: "",
  setResumeText: (resumeText) => set({ resumeText, lastMatch: null, evaluation: null }),
  lastMatch: null,
  setLastMatch: (lastMatch) => set({ lastMatch, evaluation: null }),
  evaluation: null,
  setEvaluation: (evaluation) => set({ evaluation }),
}));
