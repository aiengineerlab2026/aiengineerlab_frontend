"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/app/restaurant/components/ui/dialog";

/** Popup of 90% of the screen: the picture, centered, shrunk to fit (never enlarged beyond its natural size). */
export function ImageLightbox({ src, alt, onClose }: { src: string | null; alt: string; onClose: () => void }) {
  return (
    <Dialog open={src !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80"
        className="h-[90dvh] w-[90vw] max-w-none grid-rows-[minmax(0,1fr)] gap-0 bg-black/90 p-3 text-white ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{alt || "Image"}</DialogTitle>
        <div className="flex size-full min-h-0 items-center justify-center" onClick={onClose}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a stored data URI */}
          {src && <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} className="block max-h-full max-w-full rounded-md object-contain" />}
        </div>
        <DialogClose
          render={<Button size="icon-lg" className="absolute top-3 right-3 size-10 rounded-full bg-white text-black shadow-lg ring-2 ring-black/40 hover:bg-white/85" />}
        >
          <XIcon className="size-5" strokeWidth={2.5} />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
