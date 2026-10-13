import type { ModelOption, ModelProvider, ModelRef } from "@/app/restaurant/types/api";

export type Method = "bm25" | "vector" | "hybrid";

export interface Bm25Settings {
  lowercase: boolean;
  remove_stopwords: boolean;
  remove_punctuation: boolean;
  lemmatize: boolean;
  min_token_length: number;
  k1: number;
  b: number;
}

/** What every request carries: the retrieval method and how it is tuned. */
export interface RetrievalConfig {
  method: Method;
  top_k: number;
  /** Hybrid: Top N jobs each retriever contributes to the fusion. */
  candidate_count: number;
  /** Vector candidates below this cosine similarity are dropped. */
  vector_threshold: number;
  rrf_k: number;
  bm25: Bm25Settings;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  work_mode: string;
  level: string;
  summary: string;
  skills: string[];
  experience: string;
  responsibilities: string[];
  /** Required: a candidate without these should not apply. */
  qualifications: string[];
  nice_to_have: string[];
}

export interface MethodInfo {
  id: Method;
  name: string;
  description: string;
}

export interface Defaults {
  retrieval: RetrievalConfig;
  methods: MethodInfo[];
  spacy_model: string;
  lemmatizer_available: boolean;
  jobs: number;
}

export interface ModelCatalog {
  providers: ModelProvider[];
  embedding: ModelOption[];
  default_embedding: ModelRef;
}

export interface MatchedJob {
  job_id: string;
  rank: number;
  /** The score the final ranking is sorted by (BM25, cosine or RRF depending on the method). */
  score: number;
  bm25_score: number | null;
  bm25_rank: number | null;
  vector_score: number | null;
  vector_rank: number | null;
  rrf_score: number | null;
  /** 0-100 reading of `score`: cosine, min-max normalised RRF score over the returned jobs, or relative to the best BM25 score. */
  match_percent: number;
  job: Job;
}

export interface MatchResponse {
  method: Method;
  results: MatchedJob[];
  latency_ms: number;
  embed_ms: number | null;
  query_terms: number | null;
  notices: string[];
  embedding: ModelRef | null;
}

/** How many uses of a capped action (a resume upload) this client IP has left. */
export interface LimitUsage {
  limit: number;
  used: number;
  remaining: number;
  window_seconds: number;
  /** Until the oldest counted use expires (0 when none is counted). */
  reset_in_seconds: number;
}

/** A job the metrics treat as relevant for this resume, and where the last search ranked it. */
export interface RelevantJob {
  job_id: string;
  title: string;
  company: string;
  /** Share of the job's required skills named in the resume. */
  coverage: number;
  /** 2 = relevant, 3 = highly relevant. */
  grade: number;
  /** Position in the evaluated ranking; null when the search did not return it. */
  rank: number | null;
}

/** Precision@K, Recall@K, NDCG@K and MRR (ranx) of the last search; null = not defined (no relevant job for this resume). */
export interface RankingEvaluation {
  k: number;
  precision: number | null;
  recall: number | null;
  ndcg: number | null;
  mrr: number | null;
  relevant: RelevantJob[];
  relevant_coverage: number;
  strong_coverage: number;
  notices: string[];
}

export interface ExtractedResume {
  filename: string;
  text: string;
  characters: number;
  /** The file had more text than the resume field accepts; the rest was cut. */
  truncated: boolean;
  /** Uploads this client IP has left. */
  usage: LimitUsage;
}
