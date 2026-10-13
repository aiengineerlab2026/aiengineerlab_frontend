import { api } from "@/app/restaurant/lib/client";
import type { ModelRef } from "@/app/restaurant/types/api";
import type {
  Defaults,
  ExtractedResume,
  Job,
  LimitUsage,
  MatchResponse,
  ModelCatalog,
  RankingEvaluation,
  RetrievalConfig,
} from "@/app/myresume/types/api";

/** Every My Resume endpoint lives under this namespace. */
const MYRESUME = "/myresume";

export const myresume = {
  jobs: () => api<Job[]>(`${MYRESUME}/jobs`),
  defaults: () => api<Defaults>(`${MYRESUME}/config/defaults`),
  models: () => api<ModelCatalog>(`${MYRESUME}/models`),
  /** Text of an uploaded PDF or DOCX resume. The file is read in memory by the server and not stored. */
  extractResume: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api<ExtractedResume>(`${MYRESUME}/resume/extract`, { method: "POST", body });
  },
  /** `embedding` picks the embedding model for vector / hybrid search (the server default when null). */
  match: (resume_text: string, config: RetrievalConfig, embedding: ModelRef | null) =>
    api<MatchResponse>(`${MYRESUME}/match`, { method: "POST", body: { resume_text, config, embedding } }),
  /** How many resumes this client IP may still upload. */
  /** How many vector searches this client IP may still run. */
  vectorUsage: () => api<LimitUsage>(`${MYRESUME}/match/vector/usage`),
  uploadUsage: () => api<LimitUsage>(`${MYRESUME}/resume/usage`),
  /** Precision@K, Recall@K, NDCG@K and MRR (ranx) of the job ids a search returned, best first. No new search, no model. */
  evaluate: (resume_text: string, job_ids: string[]) =>
    api<RankingEvaluation>(`${MYRESUME}/evaluation`, { method: "POST", body: { resume_text, job_ids } }),
};

