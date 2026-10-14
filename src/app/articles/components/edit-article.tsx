"use client";

import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { errorMessage } from "@/app/restaurant/lib/client";
import { ArticleForm } from "@/app/articles/components/article-form";
import { useArticle } from "@/app/articles/hooks/use-articles";

export function EditArticle({ id }: { id: string }) {
  const { data, isPending, error } = useArticle(id);
  if (isPending) return <Skeleton className="h-96 rounded-xl" aria-hidden />;
  if (error) return <p role="alert" className="text-sm text-destructive">{errorMessage(error)}</p>;
  return <ArticleForm id={id} initial={{ title: data.title, content: data.content }} />;
}
