"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseChat, rawChat, rawSession, subscribeChat } from "@/app/restaurant/lib/chat-storage";
import type { ChatMessage } from "@/app/restaurant/types/api";

/** The conversation of this browser's session, read from localStorage and kept live as the chat writes to it. */
export function useLocalChat(): { sessionId: string | null; messages: ChatMessage[] } {
  const sessionId = useSyncExternalStore(subscribeChat, rawSession, () => null);
  const raw = useSyncExternalStore(
    subscribeChat,
    () => (sessionId ? rawChat(sessionId) : null),
    () => null,
  );
  const messages = useMemo(() => parseChat(raw), [raw]);
  return { sessionId, messages };
}
