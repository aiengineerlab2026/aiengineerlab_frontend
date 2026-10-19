"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Why a file cannot be analysed, or null. The server validates again by content; this only saves a round trip. */
export function fileProblem(file: File, maxMb: number): string | null {
  if (!TYPES.includes(file.type)) return "Unsupported format. Please choose a JPEG, PNG or WebP image.";
  if (file.size > maxMb * 1024 * 1024) return `The image is too large: the limit is ${maxMb} MB.`;
  return null;
}

/** Drag-and-drop, paste (Ctrl/Cmd+V) or click to choose an image; shows the preview once one is selected. */
export function UploadZone({
  previewUrl,
  label,
  maxMb,
  disabled,
  onFile,
  onError,
  onClear,
}: {
  previewUrl: string | null;
  label: string | null;
  maxMb: number;
  disabled?: boolean;
  onFile: (file: File) => void;
  onError: (message: string) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (file: File | undefined) => {
    if (!file || disabled) return;
    const problem = fileProblem(file, maxMb);
    if (problem) onError(problem);
    else onFile(file);
  };

  // A copied image (a screenshot, or "Copy image" on a web page) can be pasted anywhere on the page, unless the user is typing in a field.
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input:not([type=file]), textarea, [contenteditable=true]")) return;
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (!file) return;
      e.preventDefault();
      const problem = fileProblem(file, maxMb);
      if (problem) onError(problem);
      else onFile(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [disabled, maxMb, onFile, onError]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files[0]);
      }}
      className={cn(
        "relative flex min-h-56 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-slate-50/60 transition-colors",
        dragging ? "border-(--brand) bg-(--brand)/5" : "border-gray-300",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        className="sr-only"
        aria-label="Choose a street or building photo"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = ""; // lets the same file be chosen again
        }}
      />
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL or a signed example URL */}
          <img src={previewUrl} alt="The photo that will be analyzed" className="max-h-80 w-auto max-w-full object-contain" />
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            aria-label="Remove the image"
            className="absolute top-2 right-2 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
          {label && <span className="absolute bottom-2 left-2 max-w-[70%] truncate rounded bg-black/65 px-2 py-0.5 text-[11px] text-white">{label}</span>}
        </>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="flex size-full min-h-56 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-8 text-center focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-(--brand)/10 text-(--brand)">
            <ImagePlus className="size-6" />
          </span>
          <span className="text-sm font-semibold text-gray-900">Drop a street or building photo or paste it</span>
          <span className="text-xs text-gray-500">or click to choose one (Ctrl/Cmd+V to paste) · JPEG, PNG or WebP · up to {maxMb} MB</span>
        </button>
      )}
    </div>
  );
}
