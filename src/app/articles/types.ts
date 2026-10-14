export interface ArticleSummary {
  id: string;
  title: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface Article extends ArticleSummary {
  /** HTML from the rich text editor, sanitised by the backend. */
  content: string;
}

export interface ArticleInput {
  title: string;
  content: string;
}

export interface TokenResponse {
  token: string;
  username: string;
  expires_in: number;
}
