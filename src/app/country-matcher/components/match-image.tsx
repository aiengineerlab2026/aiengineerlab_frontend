"use client";

import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/restaurant/components/ui/dialog";
import { flag } from "@/app/country-matcher/lib/format";
import type { Neighbor } from "@/app/country-matcher/types/api";

/** A retrieved image with its country label and cosine similarity; opens a larger view with the source credit. */
export function MatchImage({ neighbor }: { neighbor: Neighbor }) {
  const { image, similarity, rank } = neighbor;
  const place = [image.city, image.country_name].filter(Boolean).join(", ");
  return (
    <Dialog>
      <DialogTrigger
        title="Open the image and its source"
        className="group/img relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-slate-100 text-left focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote, short-lived signed URLs: nothing for next/image to optimise */}
        <img
          src={image.url}
          alt={`Match ${rank}: a street scene labeled ${place}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-200 group-hover/img:scale-105"
        />
        <span className="absolute top-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">#{rank}</span>
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-5 pb-1 text-[11px] leading-tight text-white">
          <span className="truncate font-medium">
            {flag(image.country_code)} {image.country_name}
          </span>
          <span className="shrink-0 tabular-nums">{similarity.toFixed(3)}</span>
        </span>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1 border-b border-gray-100 p-4 pr-12">
          <DialogTitle className="text-base font-semibold text-gray-900">
            {flag(image.country_code)} {place}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Rank {rank} · cosine similarity {similarity.toFixed(4)} · labeled {image.country_name} in the dataset
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img src={image.url} alt={`A street scene labeled ${place}`} className="mx-auto max-h-[55dvh] w-auto max-w-full rounded-lg" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-gray-600">
            <dt className="font-semibold text-gray-500">Credit</dt>
            <dd>{image.attribution}</dd>
            <dt className="font-semibold text-gray-500">License</dt>
            <dd>{image.license}</dd>
          </dl>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {image.source_page_url && (
              <a href={image.source_page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-(--brand) hover:underline">
                Source page <ExternalLink className="size-3" />
              </a>
            )}
            <a href={image.original_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-(--brand) hover:underline">
              Original file <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
