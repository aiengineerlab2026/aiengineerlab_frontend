"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { ApiError, errorMessage } from "@/app/restaurant/lib/client";
import { DeleteArticleDialog } from "@/app/articles/components/delete-article-dialog";
import { formatDate, withVisibleBreaks } from "@/app/articles/components/format";
import { useArticle } from "@/app/articles/hooks/use-articles";
import { ImageLightbox } from "@/app/articles/components/image-lightbox";
import { useToken } from "@/app/articles/lib/auth";

export function ArticleView({ id }: { id: string }) {
  const token = useToken();
  const router = useRouter();
  const { data, isPending, error } = useArticle(id);
  const [deleting, setDeleting] = useState(false);
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);

  return (
    <article className="space-y-6">
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All articles
      </Link>

      {isPending && (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64" />
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof ApiError && error.status === 404 ? "This article does not exist (any more)." : errorMessage(error)}
        </p>
      )}
      {data && (
        <>
          <header className="space-y-2">
            <h1 className="text-3xl leading-tight font-bold tracking-tight">{data.title}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(data.created_at)}
              {data.updated_at !== data.created_at && formatDate(data.updated_at) !== formatDate(data.created_at) && ` · updated ${formatDate(data.updated_at)}`}
            </p>
            {token && (
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" render={<Link href={`/articles/${id}/edit`} />} nativeButton={false}>
                  <Pencil /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
                  <Trash2 /> Delete
                </Button>
              </div>
            )}
          </header>
          {/* Sanitised by the backend before it is stored (see backend/app/articles/sanitize.py). */}
          <div
            className="article-body [&_img]:cursor-zoom-in"
            onClick={(e) => {
              const img = e.target instanceof HTMLImageElement ? e.target : null;
              if (img) setZoomed({ src: img.currentSrc || img.src, alt: img.alt });
            }}
            dangerouslySetInnerHTML={{ __html: withVisibleBreaks(data.content) }}
          />
          <ImageLightbox src={zoomed?.src ?? null} alt={zoomed?.alt ?? ""} onClose={() => setZoomed(null)} />
          <DeleteArticleDialog id={id} title={data.title} open={deleting} onOpenChange={setDeleting} onDeleted={() => router.replace("/articles")} />
        </>
      )}
    </article>
  );
}
