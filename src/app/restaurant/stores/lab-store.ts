import { create } from "zustand";
import type { RetrievalTrace } from "@/app/restaurant/types/api";

export type PanelTab = "configuration" | "inspector" | "evaluation";

export interface InspectedTrace {
  trace: RetrievalTrace;
  /** What produced it: a chat turn or a manual query. */
  source: "chat" | "manual";
  label: string;
  at: number;
}

interface LabState {
  panelTab: PanelTab;
  setPanelTab: (tab: PanelTab) => void;

  /** Latest retrieval trace to show in the Retrieval Inspector. */
  inspected: InspectedTrace | null;
  inspect: (t: Omit<InspectedTrace, "at">) => void;
}

export const useLabStore = create<LabState>((set) => ({
  panelTab: "configuration",
  setPanelTab: (panelTab) => set({ panelTab }),

  inspected: null,
  inspect: (t) => set({ inspected: { ...t, at: Date.now() } }),
}));
