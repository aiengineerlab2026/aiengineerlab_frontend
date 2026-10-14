import type { Metadata } from "next";
import { EditArticle } from "@/app/articles/components/edit-article";
import { PageShell } from "@/app/articles/components/page-shell";
import { RequireAdmin } from "@/app/articles/components/require-admin";

export const metadata: Metadata = { title: "Edit article · AI Engineer Lab", robots: { index: false } };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageShell title="Edit article" wide>
      <RequireAdmin>
        <EditArticle id={id} />
      </RequireAdmin>
    </PageShell>
  );
}
