import type { Metadata } from "next";
import { ArticlesList } from "@/app/articles/components/articles-list";
import { PageShell } from "@/app/articles/components/page-shell";

export const metadata: Metadata = { title: "Articles · AI Engineer Lab" };

export default function ArticlesPage() {
  return (
    <PageShell>
      <ArticlesList />
    </PageShell>
  );
}
