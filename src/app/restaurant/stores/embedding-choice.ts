import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ModelRef } from "@/app/restaurant/types/api";

interface EmbeddingChoiceState {
  /** The embedding model this browser searches with; null = the app default. Sent with every chat message. */
  embedding: ModelRef | null;
  setEmbedding: (embedding: ModelRef | null) => void;
}

/** Per browser (localStorage), never global: each visitor can search a different pre-built index. */
export const useEmbeddingChoiceStore = create<EmbeddingChoiceState>()(
  persist(
    (set) => ({
      embedding: null,
      setEmbedding: (embedding) => set({ embedding }),
    }),
    {
      name: "embedding-choice",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // read in an effect, so the server render and the first client render match
    },
  ),
);
