import { api } from "./client";
import type {
  AppInfo,
  Cart,
  Category,
  ChatSession,
  ChatUsage,
  LiveEvaluation,
  Dish,
  LiveEvaluations,
  Menu,
  ModelCatalog,
  ModelRef,
  ModelSelection,
  Order,
  RagConfig,
  RagConfigUpdate,
  RagIndex,
  RetrieveResponse,
  SearchConstraints,
  SendMessageResponse,
  Strategies,
} from "@/app/restaurant/types/api";

export const apps = {
  list: () => api<AppInfo[]>("/apps"),
};

/** Every restaurant endpoint (menu, chat, cart, orders) lives under this namespace. */
const RESTAURANT = "/restaurant";

export const restaurant = {
  menu: (params?: { category?: string; available_only?: boolean }) => api<Menu>(`${RESTAURANT}/menu`, { query: params }),
  categories: () => api<Category[]>(`${RESTAURANT}/categories`),
  dish: (id: string) => api<Dish>(`${RESTAURANT}/menu/${id}`),
};

export const chat = {
  createSession: () => api<ChatSession>(`${RESTAURANT}/chat/sessions`, { method: "POST" }),
  getSession: (id: string) => api<ChatSession>(`${RESTAURANT}/chat/sessions/${id}`),
  usage: () => api<ChatUsage>(`${RESTAURANT}/chat/usage`),
  /** `embedding` picks which pre-built index this message searches (the app default when omitted). */
  send: (
    id: string,
    content: string,
    history: { role: "user" | "assistant"; content: string }[] = [],
    embedding?: ModelRef,
  ) =>
    api<SendMessageResponse>(`${RESTAURANT}/chat/sessions/${id}/messages`, {
      method: "POST",
      body: { content, history, embedding: embedding ?? null },
    }),
};

export const carts = {
  get: (sessionId: string) => api<Cart>(`${RESTAURANT}/carts/${sessionId}`),
  add: (sessionId: string, dishId: string, quantity = 1) =>
    api<Cart>(`${RESTAURANT}/carts/${sessionId}/items`, {
      method: "POST",
      body: { dish_id: dishId, quantity },
    }),
  setQuantity: (sessionId: string, itemId: string, quantity: number) =>
    api<Cart>(`${RESTAURANT}/carts/${sessionId}/items/${itemId}`, {
      method: "PATCH",
      body: { quantity },
    }),
  remove: (sessionId: string, itemId: string) => api<Cart>(`${RESTAURANT}/carts/${sessionId}/items/${itemId}`, { method: "DELETE" }),
};

export const orders = {
  place: (sessionId: string) =>
    api<Order>(`${RESTAURANT}/orders`, {
      method: "POST",
      body: { session_id: sessionId, confirm: true },
    }),
  get: (id: string) => api<Order>(`${RESTAURANT}/orders/${id}`),
};

export const rag = {
  strategies: () => api<Strategies>(`${RESTAURANT}/rag/strategies`),
  config: () => api<RagConfig>(`${RESTAURANT}/rag/config`),
  updateConfig: (body: RagConfigUpdate) => api<RagConfig>(`${RESTAURANT}/rag/config`, { method: "PUT", body }),
  models: () => api<ModelCatalog>(`${RESTAURANT}/rag/models`),
  /** Pick the chat, evaluation and embedding models. A new embedding model re-indexes the menu in the background. */
  updateModels: (body: ModelSelection) => api<RagConfig>(`${RESTAURANT}/rag/config/models`, { method: "PUT", body }),
  buildIndex: () => api<RagIndex>(`${RESTAURANT}/rag/config/index`, { method: "POST" }),
  indexStatus: () => api<RagIndex>(`${RESTAURANT}/rag/config/index-status`),
  retrieve: (query: string, filters?: SearchConstraints | null) =>
    api<RetrieveResponse>(`${RESTAURANT}/rag/retrieve`, {
      method: "POST",
      body: { query, filters: filters ?? null },
    }),
};

export const evaluations = {
  live: (limit = 50) => api<LiveEvaluations>(`${RESTAURANT}/evaluations/live`, { query: { limit } }),
  /** Scores of specific chat messages. The conversation itself lives in the browser. */
  lookupLive: (messageIds: string[]) =>
    api<LiveEvaluation[]>(`${RESTAURANT}/evaluations/live/lookup`, {
      query: { message_id: messageIds },
    }),
  /** The Evaluate button: score these questions now. Limited per client; 429 when the limit is used up. */
  runLive: (messageIds: string[]) =>
    api<{ queued: number; usage: ChatUsage }>(`${RESTAURANT}/evaluations/live/run`, {
      method: "POST",
      body: { message_ids: messageIds },
    }),
  clearLive: () => api<void>(`${RESTAURANT}/evaluations/live`, { method: "DELETE" }),
};
