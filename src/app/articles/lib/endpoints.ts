import { api } from "@/app/restaurant/lib/client";
import type { Article, ArticleInput, ArticleSummary, TokenResponse } from "@/app/articles/types";

export const admin = {
  login: (username: string, password: string) =>
    api<TokenResponse>("/admin/login", { method: "POST", body: { username, password } }),
  session: (token: string) => api<{ username: string }>("/admin/session", { token }),
  changePassword: (token: string, current_password: string, new_password: string) =>
    api<TokenResponse>("/admin/password", { method: "POST", token, body: { current_password, new_password } }),
};

export const articlesApi = {
  list: () => api<ArticleSummary[]>("/articles"),
  get: (id: string) => api<Article>(`/articles/${id}`),
  create: (token: string, body: ArticleInput) => api<Article>("/articles", { method: "POST", token, body }),
  update: (token: string, id: string, body: ArticleInput) =>
    api<Article>(`/articles/${id}`, { method: "PUT", token, body }),
  remove: (token: string, id: string) => api<void>(`/articles/${id}`, { method: "DELETE", token }),
};
