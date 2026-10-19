"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Images, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/restaurant/components/ui/alert";
import { Button } from "@/app/restaurant/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/restaurant/components/ui/dialog";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { errorMessage } from "@/app/restaurant/lib/client";
import { cn } from "@/app/restaurant/lib/utils";
import { useIndexedImages, useModels } from "@/app/country-matcher/hooks/use-country-matcher";
import { flag, MODEL_COLOR, MODEL_LABEL } from "@/app/country-matcher/lib/format";
import { MODEL_IDS, type IndexedImage, type ModelId } from "@/app/country-matcher/types/api";

function ModelBadges({ models, className }: { models: ModelId[]; className?: string }) {
  return (
    <span className={cn("flex gap-1", className)}>
      {MODEL_IDS.map((m) => {
        const on = models.includes(m);
        return (
          <span
            key={m}
            title={on ? `Embedded with ${MODEL_LABEL[m]}` : `No ${MODEL_LABEL[m]} embedding`}
            className={cn("rounded px-1.5 py-px text-[10px] leading-4 font-semibold", on ? "text-white" : "bg-gray-200 text-gray-500 line-through")}
            style={on ? { background: MODEL_COLOR[m] } : undefined}
          >
            {MODEL_LABEL[m]}
          </span>
        );
      })}
    </span>
  );
}

function Tile({ image }: { image: IndexedImage }) {
  const place = [image.city, image.country_name].filter(Boolean).join(", ");
  return (
    <Dialog>
      <DialogTrigger
        title="Open the image and its source"
        className="group/img relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-slate-100 text-left focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote, short-lived signed URLs: nothing for next/image to optimise */}
        <img src={image.url} alt={`An indexed street scene labeled ${place}`} loading="lazy" className="size-full object-cover transition-transform duration-200 group-hover/img:scale-105" />
        <ModelBadges models={image.models} className="absolute top-1 left-1" />
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-5 pb-1 text-[11px] font-medium text-white">
          {flag(image.country_code)} {place}
        </span>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1 border-b border-gray-100 p-4 pr-12">
          <DialogTitle className="text-base font-semibold text-gray-900">
            {flag(image.country_code)} {place}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            Indexed with <ModelBadges models={image.models} />
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

/** A "Show images" button that opens a centered popup with the searchable dataset, each photo marked with the models that embedded it. */
export function IndexedImages() {
  const models = useModels();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const query = useIndexedImages(open, country);

  const total = models.data?.dataset.index_images;
  const first = query.data?.pages[0];
  const images = query.data?.pages.flatMap((p) => p.images) ?? [];

  return (
    <section aria-labelledby="cm-indexed" className="rounded-xl border border-gray-200 bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="cm-indexed" className="text-base font-semibold text-gray-900">The indexed images</h2>
          <p className="mt-0.5 text-xs text-gray-600">
            The labeled photos the models search{total !== undefined ? ` (${total} of them)` : ""}. Each one was embedded once with CLIP and once with ResNet50; the held-out test photos
            are not in this list.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" variant="outline" disabled={!models.data?.ready} />}>
            <Images />
            Show images
          </DialogTrigger>
          <DialogContent className="flex h-[min(46rem,90dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
            <DialogHeader className="gap-1 border-b border-gray-100 p-4 pr-12">
              <DialogTitle className="text-base font-semibold text-gray-900">The indexed images</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                {total !== undefined ? `${total} photos, each embedded with` : "Each photo embedded with"} <ModelBadges models={[...MODEL_IDS]} />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-y-auto p-4">
              {first && (
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by country">
                  {[{ code: null as string | null, name: "All", images: total ?? 0 }, ...first.countries].map((c) => (
                    <button
                      key={c.code ?? "all"}
                      type="button"
                      aria-pressed={country === c.code}
                      onClick={() => setCountry(c.code)}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none",
                        country === c.code ? "border-(--brand) bg-(--brand) text-white" : "border-gray-300 bg-white text-gray-700 hover:border-(--brand)/50",
                      )}
                    >
                      {c.code ? `${flag(c.code)} ` : ""}
                      {c.name} <span className="tabular-nums opacity-70">{c.images}</span>
                    </button>
                  ))}
                </div>
              )}

              {query.isPending && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <Skeleton key={i} className="aspect-[4/3] w-full" />
                  ))}
                </div>
              )}
              {query.isError && (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>Couldn&apos;t load the images</AlertTitle>
                  <AlertDescription>{errorMessage(query.error)}</AlertDescription>
                </Alert>
              )}
              {first && images.length === 0 && <p className="text-sm text-gray-500">No indexed images for this country.</p>}
              {images.length > 0 && (
                <>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((image) => (
                      <li key={image.id}>
                        <Tile image={image} />
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                    <span>
                      Showing {images.length} of {first?.total}
                    </span>
                    {query.hasNextPage && (
                      <Button type="button" variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                        {query.isFetchingNextPage && <Loader2 className="animate-spin" />}
                        Show more
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
