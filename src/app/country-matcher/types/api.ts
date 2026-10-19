/** Mirrors the backend schemas of /api/v1/country-matcher (backend/app/country_matcher/presentation/schemas.py). */

export type ModelId = "clip" | "resnet50";
export type Aggregation = "majority" | "weighted";
export const MODEL_IDS: ModelId[] = ["clip", "resnet50"];

export interface ModelInfo {
  id: ModelId;
  label: string;
  model_name: string;
  dimension: number;
  description: string;
  loaded: boolean;
  index: { images: number; versions: string[] };
}

export interface ModelsResponse {
  models: ModelInfo[];
  dataset: { index_images: number; test_images: number; countries: number };
  default_k: number;
  max_k: number;
  max_upload_mb: number;
  aggregations: Aggregation[];
  /** Both models have a searchable index. */
  ready: boolean;
}

export interface Example {
  id: string;
  url: string;
  width: number;
  height: number;
  attribution: string;
  license: string;
  source_page_url: string | null;
}

export interface DatasetImage {
  id: string;
  /** Public or signed (short-lived) URL. Never carries a secret. */
  url: string;
  country_code: string;
  country_name: string;
  city: string | null;
  width: number;
  height: number;
  license: string;
  attribution: string;
  source_page_url: string | null;
  original_url: string;
}

/** A searchable image and the models that have stored an embedding of it. */
export interface IndexedImage extends DatasetImage {
  models: ModelId[];
}

export interface IndexedImagesPage {
  /** Images matching the country filter. */
  total: number;
  offset: number;
  limit: number;
  countries: { code: string; name: string; images: number }[];
  images: IndexedImage[];
}

export interface Neighbor {
  rank: number;
  similarity: number;
  image: DatasetImage;
}

export interface CountryScore {
  country_code: string;
  country_name: string;
  votes: number;
  weight: number;
  /** Share of the neighbour evidence behind this country (0..1). Not a calibrated probability. */
  support: number;
}

export interface Prediction {
  model: ModelId;
  model_name: string;
  model_version: string;
  dimension: number;
  aggregation: Aggregation;
  k: number;
  country: CountryScore;
  ranking: CountryScore[];
  neighbors: Neighbor[];
  explanation: string;
  timings: { embed_ms: number; search_ms: number; total_ms: number };
  support_note: string;
}

export interface QueryInfo {
  example_id: string | null;
  actual_country_code: string | null;
  actual_country_name: string | null;
}

export interface AnalysisResult {
  query: QueryInfo;
  predictions: Partial<Record<ModelId, Prediction>>;
}

export interface Examples {
  examples: Example[];
}

// ---- stored evaluation (only ever read, produced by `python -m app.country_matcher.cli evaluate`) ----

export interface LatencySummary {
  mean: number;
  p50: number;
  p95: number;
}

export interface ModelEvaluation {
  model_name: string;
  model_version: string;
  dimension: number;
  /** Keys are `precision@K`, `recall@K`, `ndcg@K`, `mrr@K` for the run's K. */
  retrieval: { queries: number } & Record<string, number | null>;
  classification: {
    queries: number;
    top1_accuracy: number;
    top3_accuracy: number;
    macro_f1: number;
    per_country: { code: string; name: string; precision: number; recall: number; f1: number; support: number }[];
    confusion_matrix: { labels: string[]; names: string[]; matrix: number[][] };
  };
  performance: {
    embed_ms: LatencySummary;
    search_ms: LatencySummary;
    total_ms: LatencySummary;
    dimension: number;
    indexed_vectors: number;
    vector_bytes_per_image: number;
    vector_bytes_total: number;
    table_and_index_bytes: number;
    device: string;
  };
}

export interface EvaluationResults {
  generated_at: string;
  k: number;
  aggregation: Aggregation;
  relevance_note: string;
  dataset: {
    index_images: number;
    test_images: number;
    countries: number;
    per_country: { code: string; name: string; index: number; test: number }[];
    leakage_audit: { shared_image_hashes: number; shared_scene_groups: number; near_duplicate_pairs: number };
  };
  environment: { python?: string; torch?: string };
  models: Record<ModelId, ModelEvaluation>;
}

export interface EvaluationResponse {
  available: boolean;
  generated_at: string | null;
  results: EvaluationResults | null;
}
