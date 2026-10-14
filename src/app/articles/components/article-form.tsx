"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/restaurant/components/ui/button";
import { Input } from "@/app/restaurant/components/ui/input";
import { Label } from "@/app/restaurant/components/ui/label";
import { errorMessage } from "@/app/restaurant/lib/client";
import { RichTextEditor } from "@/app/articles/components/rich-text-editor";
import { useSaveArticle } from "@/app/articles/hooks/use-articles";
import type { ArticleInput } from "@/app/articles/types";

/** Title + rich text body. Without `id` it adds an article, with one it edits that article. */
export function ArticleForm({ id, initial }: { id?: string; initial?: ArticleInput }) {
  const router = useRouter();
  const save = useSaveArticle(id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const canSave = title.trim() !== "" && content !== "" && !save.isPending;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        save.mutate(
          { title: title.trim(), content },
          {
            onSuccess: (article) => {
              toast.success(id ? "Article updated." : "Article added.");
              router.push(`/articles/${article.id}`);
            },
          },
        );
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" maxLength={200} autoFocus={!id} placeholder="Article title" className="h-10 text-base font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label>Content</Label>
        <RichTextEditor initialContent={initial?.content ?? ""} onChange={setContent} />
      </div>
      {save.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(save.error)}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="lg" render={<Link href={id ? `/articles/${id}` : "/articles"} />} nativeButton={false}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="bg-(--brand) text-white hover:bg-(--brand-hover)" disabled={!canSave}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {id ? "Save changes" : "Publish article"}
        </Button>
      </div>
    </form>
  );
}
