import type { ApiErrorBody } from "@/app/restaurant/types/api";

/** NEXT_PUBLIC_API_BASE_URL is the backend host; the `/api/v1` prefix is added here (a value that already ends with it also works). */
export const API_BASE_URL = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000")
  .replace(/\/$/, "")
  .replace(/\/api\/v1$/, "")}/api/v1`;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | string[] | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    for (const v of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(v));
  }
  return url.toString();
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers: opts.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`,
      0,
      "network_error",
    );
  }

  if (!res.ok) {
    let body: Partial<ApiErrorBody> | null = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error */
    }
    const err = body?.error;
    // FastAPI's own request validation uses {"detail": [...]} when not intercepted.
    throw new ApiError(
      err?.message ?? `Request failed (${res.status})`,
      res.status,
      err?.code ?? "http_error",
      err?.details ?? {},
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
