import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ModelRef } from "@/app/restaurant/types/api";
import type { Bm25Settings, RetrievalConfig } from "@/app/myresume/types/api";

/** Same as the backend's defaults (GET /myresume/config/defaults); used until the user changes something. */
export const DEFAULT_CONFIG: RetrievalConfig = {
  method: "hybrid",
  top_k: 5,
  candidate_count: 20,
  vector_threshold: 0,
  rrf_k: 60,
  bm25: {
    lowercase: true,
    remove_stopwords: true,
    remove_punctuation: true,
    lemmatize: true,
    min_token_length: 2,
    k1: 1.5,
    b: 0.75,
  },
};

interface SettingsState {
  config: RetrievalConfig;
  /** null = the server default. */
  embedding: ModelRef | null;
  patch: (p: Partial<Omit<RetrievalConfig, "bm25">>) => void;
  patchBm25: (p: Partial<Bm25Settings>) => void;
  setEmbedding: (m: ModelRef | null) => void;
  reset: () => void;
}

/** Per browser (localStorage): every visitor tunes the lab on their own, the backend keeps no state. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      embedding: null,
      patch: (p) => set((s) => ({ config: { ...s.config, ...p } })),
      patchBm25: (p) => set((s) => ({ config: { ...s.config, bm25: { ...s.config.bm25, ...p } } })),
      setEmbedding: (embedding) => set({ embedding }),
      reset: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: "myresume-settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // read in an effect, so the server render and the first client render match
      // A saved value from an older shape must never break the page: new fields fall back to the defaults.
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...s,
          config: { ...DEFAULT_CONFIG, ...s.config, bm25: { ...DEFAULT_CONFIG.bm25, ...s.config?.bm25 } },
        };
      },
    },
  ),
);
