"use client";

import { useState } from "react";
import Link from "next/link";
import { Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { errorMessage } from "@/app/restaurant/lib/client";
import { DeleteArticleDialog } from "@/app/articles/components/delete-article-dialog";
import { formatDate } from "@/app/articles/components/format";
import { useArticles } from "@/app/articles/hooks/use-articles";
import { useToken } from "@/app/articles/lib/auth";
import type { ArticleSummary } from "@/app/articles/types";

function ArticleCard({ article, isAdmin, onDelete }: { article: ArticleSummary; isAdmin: boolean; onDelete: () => void }) {
  return (
    <li className="group relative rounded-xl border border-l-4 border-l-(--brand) bg-card p-4 shadow-xs transition-shadow focus-within:shadow-md hover:shadow-md sm:p-5">
      <h2 className="text-lg font-bold leading-snug">
        {/* the whole card is the link: its ::after covers the card, the admin buttons sit above it */}
        <Link href={`/articles/${article.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
          {article.title}
        </Link>
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(article.created_at)}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/80">{article.excerpt}</p>
      {isAdmin && (
        <div className="relative z-10 mt-3 flex gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/articles/${article.id}/edit`} />} nativeButton={false}>
            <Pencil /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 /> Delete
          </Button>
        </div>
      )}
    </li>
  );
}

export function ArticlesList() {
  const token = useToken();
  const { data, isPending, error } = useArticles();
  const [toDelete, setToDelete] = useState<ArticleSummary | null>(null);

  return (
    <section aria-label="Articles" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Articles</h2>
        {token && (
          <Button size="lg" className="bg-(--brand) text-white hover:bg-(--brand-hover)" render={<Link href="/articles/new" />} nativeButton={false}>
            <Plus /> Add article
          </Button>
        )}
      </div>

      {isPending && (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage(error)}</p>}
      {data && data.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center text-muted-foreground">
          <Newspaper className="size-8" />
          <p className="text-sm">No articles yet.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((a) => <ArticleCard key={a.id} article={a} isAdmin={!!token} onDelete={() => setToDelete(a)} />)}
        </ul>
      )}

      {toDelete && (
        <DeleteArticleDialog
          id={toDelete.id}
          title={toDelete.title}
          open
          onOpenChange={(o) => !o && setToDelete(null)}
          onDeleted={() => setToDelete(null)}
        />
      )}
    </section>
  );
}
