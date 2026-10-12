import type { ChatMessage } from "@/app/restaurant/types/api";

/**
 * Chat messages live only in this browser (localStorage), keyed by session id, so different users never share a
 * conversation and nothing is stored on the server. The backend session only keeps the cart and order state.
 */
const PREFIX = "rag-lab.restaurant.chat.";
export const SESSION_KEY = "rag-lab.restaurant.session";
const CHANGED = "rag-lab:chat-changed";

/** Other parts of the page (the Evaluation tab) read the same storage, so every write announces itself. */
export function notifyChatChange(): void {
  window.dispatchEvent(new Event(CHANGED));
}

export function subscribeChat(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange); // another tab
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The raw stored strings (stable between renders when nothing changed), for `useSyncExternalStore`. */
export function rawSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function rawChat(sessionId: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + sessionId);
  } catch {
    return null;
  }
}

export function parseChat(raw: string | null): ChatMessage[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed as ChatMessage[];
  } catch {
    // corrupted storage
  }
  return [];
}
const MAX_MESSAGES = 60;
/** Retrieval traces are large; only the most recent ones are kept once the storage quota is hit. */
const KEEP_TRACES = 3;

export const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm your AI Waiter. Ask me for recommendations (\"high-protein chicken under $20\"), " +
    "or tell me what to add to your cart.",
  metadata: { intent: "greeting" },
  created_at: new Date(0).toISOString(),
};

export function loadChat(sessionId: string): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(PREFIX + sessionId);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) {
      // The greeting is static text: show the current wording, not whatever was stored (e.g. the old EGP example).
      return (parsed as ChatMessage[]).map((m) => (m.id === GREETING.id ? GREETING : m));
    }
  } catch {
    // corrupted or unavailable storage: start with a fresh conversation
  }
  return [GREETING];
}

export function saveChat(sessionId: string, messages: ChatMessage[]): void {
  const recent = messages.slice(-MAX_MESSAGES);
  const slim = recent.map((m, i) => {
    if (i >= recent.length - KEEP_TRACES * 2 || !m.metadata?.trace) return m;
    const rest = { ...m.metadata };
    delete rest.trace;
    return { ...m, metadata: rest };
  });
  for (const attempt of [recent, slim]) {
    try {
      window.localStorage.setItem(PREFIX + sessionId, JSON.stringify(attempt));
      notifyChatChange();
      return;
    } catch {
      // quota exceeded: retry without the older traces
    }
  }
}

export function clearChat(sessionId: string | null): void {
  if (!sessionId) return;
  try {
    window.localStorage.removeItem(PREFIX + sessionId);
    notifyChatChange();
  } catch {
    // ignore
  }
}

/** The recent turns the backend needs to understand follow-ups ("make it spicier"). */
export function historyFor(messages: ChatMessage[]) {
  return messages
    .filter(
      (m) => m.metadata?.intent !== "greeting" && !m.metadata?.error && (m.role === "user" || m.role === "assistant"),
    )
    .slice(-8)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 2000) }));
}
