import { api } from "@/app/restaurant/lib/client";
import type {
  Aggregation,
  AnalysisResult,
  EvaluationResponse,
  Examples,
  IndexedImagesPage,
  ModelId,
  ModelsResponse,
  Prediction,
  QueryInfo,
} from "@/app/country-matcher/types/api";

/** Every Country Matcher endpoint lives under this namespace. */
const NS = "/country-matcher";

export type QueryImage = { kind: "file"; file: File } | { kind: "example"; id: string };
export type Choice = ModelId | "both";

function form(image: QueryImage, k: number, aggregation: Aggregation, model?: ModelId): FormData {
  const body = new FormData();
  if (image.kind === "file") body.append("file", image.file);
  else body.append("example_id", image.id);
  if (model) body.append("model", model);
  body.append("k", String(k));
  body.append("aggregation", aggregation);
  return body;
}

export const countryMatcher = {
  models: () => api<ModelsResponse>(`${NS}/models`),
  examples: () => api<Examples>(`${NS}/examples`, { query: { limit: 10 } }),
  /** The searchable images, optionally of one country, a page at a time. */
  indexedImages: (country: string | null, offset: number, limit = 24) =>
    api<IndexedImagesPage>(`${NS}/indexed-images`, { query: { limit, offset, ...(country ? { country } : {}) } }),
  /** Stored results of the offline evaluation. The server never recomputes them on request. */
  evaluation: () => api<EvaluationResponse>(`${NS}/evaluation`),
  /** One model (/predict) or both (/compare), normalised to the same shape. */
  analyze: async (image: QueryImage, choice: Choice, k: number, aggregation: Aggregation): Promise<AnalysisResult> => {
    if (choice === "both") {
      return api<{ query: QueryInfo; predictions: Record<ModelId, Prediction> }>(`${NS}/compare`, {
        method: "POST",
        body: form(image, k, aggregation),
      });
    }
    const r = await api<{ query: QueryInfo; prediction: Prediction }>(`${NS}/predict`, {
      method: "POST",
      body: form(image, k, aggregation, choice),
    });
    return { query: r.query, predictions: { [choice]: r.prediction } };
  },
};
