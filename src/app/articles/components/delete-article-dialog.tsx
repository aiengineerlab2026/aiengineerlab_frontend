"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/restaurant/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/restaurant/components/ui/dialog";
import { errorMessage } from "@/app/restaurant/lib/client";
import { useDeleteArticle } from "@/app/articles/hooks/use-articles";

export function DeleteArticleDialog({ id, title, open, onOpenChange, onDeleted }: {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteArticle();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this article?</DialogTitle>
          <DialogDescription>“{title}” will be removed for everyone. This cannot be undone.</DialogDescription>
        </DialogHeader>
        {remove.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(remove.error)}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(id, {
                onSuccess: () => {
                  toast.success("Article deleted.");
                  onOpenChange(false);
                  onDeleted?.();
                },
              })
            }
          >
            {remove.isPending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
