"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/app/restaurant/lib/client";
import { articlesApi } from "@/app/articles/lib/endpoints";
import { getToken, setToken } from "@/app/articles/lib/auth";
import type { ArticleInput } from "@/app/articles/types";

const keys = { all: ["articles"] as const, one: (id: string) => ["articles", id] as const };

export const useArticles = () => useQuery({ queryKey: keys.all, queryFn: articlesApi.list });

export const useArticle = (id: string) => useQuery({ queryKey: keys.one(id), queryFn: () => articlesApi.get(id) });

/** An admin call: uses the stored token, and a rejected token logs this browser out (the page then asks to log in). */
function adminCall<T>(call: (token: string) => Promise<T>): Promise<T> {
  const token = getToken();
  if (!token) {
    setToken(null);
    return Promise.reject(new ApiError("Please log in.", 401, "unauthorized"));
  }
  return call(token).catch((e) => {
    if (e instanceof ApiError && e.status === 401) setToken(null);
    throw e;
  });
}

export function useSaveArticle(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ArticleInput) =>
      adminCall((t) => (id ? articlesApi.update(t, id, body) : articlesApi.create(t, body))),
    onSuccess: (article) => {
      qc.setQueryData(keys.one(article.id), article);
      void qc.invalidateQueries({ queryKey: keys.all, exact: true });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCall((t) => articlesApi.remove(t, id)),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: keys.one(id) });
      void qc.invalidateQueries({ queryKey: keys.all, exact: true });
    },
  });
}
