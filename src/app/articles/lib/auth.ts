import { useSyncExternalStore } from "react";

const KEY = "admin-token";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** The admin login token of this browser (localStorage), or null when logged out. */
export function getToken(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the login only lasts until the page is closed, nothing else to do */
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener); // another tab logged in or out
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** `undefined` while the page is still hydrating (the server cannot know), then the token or null. */
export function useToken(): string | null | undefined {
  return useSyncExternalStore(subscribe, getToken, () => undefined);
}
