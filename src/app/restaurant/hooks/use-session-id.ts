"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, errorMessage } from "@/app/restaurant/lib/client";
import { chat } from "@/app/restaurant/lib/endpoints";
import { SESSION_KEY as STORAGE_KEY, clearChat, notifyChatChange } from "@/app/restaurant/lib/chat-storage";

// Dedupes the create/verify round-trip (React StrictMode runs effects twice in dev).
let inflight: Promise<string> | null = null;

async function resolveSession(): Promise<string> {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      await chat.getSession(stored);
      return stored;
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e;
      clearChat(stored); // the backend forgot this session, so its saved conversation is orphaned
    }
  }
  const created = await chat.createSession();
  window.localStorage.setItem(STORAGE_KEY, created.id);
  notifyChatChange();
  return created.id;
}

/** A demo session id persisted in localStorage; re-created if the backend no longer knows it. */
export function useSessionId() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    inflight ??= resolveSession().finally(() => {
      inflight = null;
    });
    inflight
      .then((id) => !cancelled && setSessionId(id))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Start over with a brand-new session (empty cart and chat). */
  const reset = useCallback(async () => {
    const previous = window.localStorage.getItem(STORAGE_KEY);
    const created = await chat.createSession();
    clearChat(previous);
    window.localStorage.setItem(STORAGE_KEY, created.id);
    notifyChatChange();
    setSessionId(created.id);
  }, []);

  return { sessionId, error, reset };
}
