import type { Metadata } from "next";
import { ArticleView } from "@/app/articles/components/article-view";
import { PageShell } from "@/app/articles/components/page-shell";

export const metadata: Metadata = { title: "Article · AI Engineer Lab" };

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageShell>
      <ArticleView id={id} />
    </PageShell>
  );
}
