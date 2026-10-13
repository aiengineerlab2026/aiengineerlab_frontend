"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/app/restaurant/lib/client";
import { cn } from "@/app/restaurant/lib/utils";
import { keys, useUploadUsage } from "@/app/myresume/hooks/use-myresume";
import { myresume } from "@/app/myresume/lib/endpoints";
import { UploadLimitNote } from "./limit-notes";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Why a file cannot be uploaded, or null. The server checks again (by content); this only saves a round trip. */
function problem(file: File): string | null {
  if (!/\.(pdf|docx)$/i.test(file.name)) return "Only PDF and DOCX files are supported.";
  if (file.size > MAX_BYTES) return `The file is too large: the limit is ${MAX_BYTES / (1024 * 1024)} MB.`;
  return null;
}

/** Choose or drop a PDF/DOCX; its extracted text becomes the resume that is matched. */
export function ResumeUpload({ text, onText }: { text: string; onText: (text: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const qc = useQueryClient();
  const usage = useUploadUsage().data;
  const exhausted = !!usage && usage.limit > 0 && usage.remaining === 0;

  const extract = useMutation({
    mutationFn: (file: File) => myresume.extractResume(file),
    onSuccess: (r) => {
      qc.setQueryData(keys.uploadUsage, r.usage);
      onText(r.text);
      setName(r.filename);
      toast.success(`Read ${r.characters.toLocaleString()} characters from ${r.filename}`);
      if (r.truncated) toast.warning("The file was longer than the resume field allows, so the end was cut.");
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      void qc.invalidateQueries({ queryKey: keys.uploadUsage });
    },
  });

  const pick = (file: File | undefined) => {
    if (!file || exhausted) return;
    const why = problem(file);
    if (why) toast.error(why);
    else extract.mutate(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files[0]);
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-7 text-center text-xs transition-colors",
        dragging ? "border-(--brand) bg-(--brand)/5" : "border-gray-300",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Upload a PDF or DOCX resume"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = ""; // lets the same file be chosen again
        }}
      />
      <button
        type="button"
        disabled={extract.isPending || exhausted}
        onClick={() => input.current?.click()}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-card px-3 py-1.5 font-medium text-gray-800 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {extract.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
        {extract.isPending ? "Reading file…" : text ? "Replace resume" : "Attach resume (PDF or DOCX)"}
      </button>
      {name && text && !extract.isPending ? (
        <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-gray-700">
          <FileText className="size-3.5 shrink-0 text-(--brand)" />
          <span className="truncate" title={name}>{name}</span>
          <span className="shrink-0 text-gray-500">· {text.length.toLocaleString()} characters read</span>
          <button
            type="button"
            aria-label="Remove the file"
            onClick={() => {
              setName(null);
              onText("");
            }}
            className="cursor-pointer text-gray-400 hover:text-gray-700"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ) : (
        <span className="text-gray-500">or drop your resume here (PDF or DOCX, max 5 MB)</span>
      )}
      <UploadLimitNote />
    </div>
  );
}
