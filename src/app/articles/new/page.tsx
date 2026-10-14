import type { Metadata } from "next";
import { ArticleForm } from "@/app/articles/components/article-form";
import { PageShell } from "@/app/articles/components/page-shell";
import { RequireAdmin } from "@/app/articles/components/require-admin";

export const metadata: Metadata = { title: "Add article · AI Engineer Lab", robots: { index: false } };

export default function NewArticlePage() {
  return (
    <PageShell title="Add article" wide>
      <RequireAdmin>
        <ArticleForm />
      </RequireAdmin>
    </PageShell>
  );
}
