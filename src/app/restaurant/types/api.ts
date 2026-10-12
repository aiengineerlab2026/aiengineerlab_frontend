/** Wire types of the restaurant API. They mirror backend/app/restaurant/presentation/schemas.py. */

// ---------------------------------------------------------------- menu
export interface Dish {
  id: string;
  name: string;
  category: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  price: number;
  currency: string;
  calories: number;
  protein_grams: number;
  spice_level: number;
  tags: string[];
  available: boolean;
  image_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  dish_count: number;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  currency: string;
}

export interface Menu {
  restaurant: Restaurant;
  dishes: Dish[];
}

// ---------------------------------------------------------------- cart & orders
export interface CartItem {
  id: string;
  dish_id: string;
  name: string;
  category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Cart {
  session_id: string;
  currency: string;
  items: CartItem[];
  item_count: number;
  total: number;
}

export interface OrderItem {
  dish_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  session_id: string;
  status: string;
  currency: string;
  total: number;
  items: OrderItem[];
  created_at: string;
  demo: boolean;
}

// ---------------------------------------------------------------- chat
export interface ChatSession {
  id: string;
  created_at: string;
  pending_order_confirmation: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Per-IP chat budget. `enabled: false` means there is no limit. */
export interface ChatUsage {
  enabled: boolean;
  limit: number;
  used: number;
  remaining: number;
  window_seconds: number;
  reset_in_seconds: number;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  cart: Cart;
  recommended_dishes: Dish[];
  order: Order | null;
}

// ---------------------------------------------------------------- RAG
export type ChunkingStrategy = "fixed" | "recursive" | "semantic" | "entity";
export type RetrievalStrategy = "vector" | "multi_query" | "multi_query_rerank" | "hybrid_rrf";
export type LengthUnit = "characters" | "tokens";
export type BreakpointType = "percentile" | "standard_deviation" | "interquartile" | "gradient";

export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunk_size: number;
  chunk_overlap: number;
  length_unit: LengthUnit;
  separators: string[];
  breakpoint_threshold_type: BreakpointType;
  breakpoint_threshold_amount: number;
}

export interface RetrievalConfig {
  strategy: RetrievalStrategy;
  top_k: number;
  num_query_variants: number;
  candidate_count: number;
  rerank_enabled: boolean;
  reranker_model: string;
  rrf_k: number;
}

export interface EmbeddingSpec {
  provider: string;
  model: string;
  dimensions: number;
  version: string;
}

/** `awaiting`: a live-evaluation question that is recorded but not yet evaluated (the Evaluate button was not pressed). */
export type JobStatus = "awaiting" | "pending" | "running" | "completed" | "failed";
export type IndexStatus = "pending" | "building" | "ready" | "failed";

export interface RagIndex {
  id: string;
  fingerprint: string;
  status: IndexStatus;
  chunk_count: number;
  progress: Record<string, unknown>;
  error: string | null;
  chunking: ChunkingConfig;
  embedding: EmbeddingSpec;
  dataset_version: string;
  created_at: string;
  completed_at: string | null;
}

/** The one live RAG configuration. Every edit applies to the next question. */
export interface RagConfig {
  chunking: ChunkingConfig;
  retrieval: RetrievalConfig;
  embedding: EmbeddingSpec;
  llm_model: string;
  dataset_version: string;
  index_fingerprint: string;
  updated_at: string;
  index: RagIndex | null;
}

export interface RagConfigUpdate {
  chunking: ChunkingConfig;
  retrieval: RetrievalConfig;
}

export interface SearchConstraints {
  max_price?: number | null;
  min_price?: number | null;
  max_calories?: number | null;
  min_calories?: number | null;
  min_protein?: number | null;
  exclude_allergens?: string[];
  exclude_ingredients?: string[];
  categories?: string[];
  dietary?: string[];
  spicy_only?: boolean;
}

export interface TraceChunk {
  rank: number;
  chunk_id: string;
  content: string;
  dish_ids: string[];
  dish_names: string[];
  /** Labelled scores. Different score types are NOT comparable with each other. */
  scores: Record<string, number>;
  metadata: Record<string, unknown>;
}

export interface TraceStage {
  name: string;
  description: string;
  score_type: string;
  query: string | null;
  items: TraceChunk[];
  latency_ms: number;
}

export interface RetrievalTrace {
  query: string;
  query_variants: string[];
  filters: Record<string, unknown>;
  chunking: ChunkingConfig;
  retrieval: RetrievalConfig;
  index_fingerprint: string;
  embedding_model: string;
  stages: TraceStage[];
  chunks: TraceChunk[];
  context: string;
  final_score_type: string;
  latency_ms: number;
  latency_breakdown_ms: Record<string, number>;
  warnings: string[];
}

export interface RetrieveResponse {
  trace: RetrievalTrace;
  dish_ids: string[];
}

export interface StrategyInfo {
  id: string;
  name: string;
  description: string;
  /** Config fields this strategy actually uses; every other field should be disabled in the UI. */
  uses: string[];
  requires_llm: boolean;
}

export interface ModelRef {
  provider: string;
  model: string;
}
/** The language models shared by everyone. The embedding model is chosen per request. */
export interface ModelSelection {
  llm: ModelRef;
  judge: ModelRef;
}
export interface ModelOption extends ModelRef {
  label: string;
  note: string;
  /** Embedding models: width of the vectors. */
  dimensions: number;
  /** > 0: the provider said the free quota is used up; the model is usable again after this many seconds. */
  quota_exhausted_for_seconds: number;
}
export interface ModelProvider {
  id: string;
  name: string;
  /** Credentials are present in backend/.env. */
  configured: boolean;
  hint: string | null;
}
export interface ModelCatalog {
  providers: ModelProvider[];
  chat: ModelOption[];
  embedding: ModelOption[];
  selection: ModelSelection;
  /** Used by requests that do not name an embedding model. */
  default_embedding: ModelRef;
}

export interface Strategies {
  chunking: StrategyInfo[];
  retrieval: StrategyInfo[];
  rerankers: string[];
  defaults: { chunking: ChunkingConfig; retrieval: RetrievalConfig };
  embedding: EmbeddingSpec;
  llm: { provider: string; model: string; configured: boolean; judge_model: string };
}

// ---------------------------------------------------------------- evaluation
export interface ConfigSnapshot {
  chunking: ChunkingConfig;
  retrieval: RetrievalConfig;
  embedding: EmbeddingSpec;
  llm_model: string;
  dataset_version: string;
  menu_dataset_version: string;
  index_fingerprint: string;
}

// ---------------------------------------------------------------- live evaluation (real customer questions)
export interface LiveEvaluation {
  id: string;
  session_id: string;
  /** The assistant message (in this browser's chat) that was scored. */
  message_id: string;
  /** The configuration this answer was produced with. */
  config_snapshot: Partial<ConfigSnapshot>;
  /** Exactly what the customer typed. Blank on the server once scored: the browser keeps the conversation. */
  question: string;
  /** The standalone search query that was retrieved with. */
  query: string;
  filters: Record<string, unknown>;
  /** The reply the customer actually saw. */
  answer: string;
  contexts: string[];
  status: JobStatus;
  stage: string;
  /** Dishes the judge LLM decided a perfect answer should contain (no human ground truth). */
  relevant_dish_ids: string[];
  retrieved_dish_ids: string[];
  retrieval_metrics: Record<string, number | null>;
  ragas_scores: Record<string, number | null>;
  latency_ms: number;
  judge_model: string;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface LiveGroup {
  /** The configuration these questions were answered with. */
  config_snapshot: Partial<ConfigSnapshot>;
  count: number;
  metrics: Record<string, number | null>;
}

export interface LiveSummary {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  metrics: Record<string, number | null>;
  by_config: LiveGroup[];
  judge_model: string;
}

export interface LiveEvaluations {
  enabled: boolean;
  /** Newest first. */
  items: LiveEvaluation[];
  summary: LiveSummary;
  /** How many evaluations this client (IP address) may still trigger. */
  usage: ChatUsage;
}

// ---------------------------------------------------------------- apps
export interface AppInfo {
  id: string;
  name: string;
  description: string;
  tags: string[];
  route: string;
  icon: string;
  status: string;
}

// ---------------------------------------------------------------- errors
export interface ApiErrorBody {
  error: { code: string; message: string; details?: Record<string, unknown> };
}
