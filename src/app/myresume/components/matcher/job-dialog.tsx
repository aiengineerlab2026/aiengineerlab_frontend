"use client";

import { Building2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/restaurant/components/ui/dialog";
import type { Job } from "@/app/myresume/types/api";
import { JobDetails } from "./job-details";

/** A job title that opens the whole posting (description, responsibilities, requirements) in a centered modal. */
export function JobTitleButton({ job, className }: { job: Job; className?: string }) {
  return (
    <Dialog>
      <DialogTrigger
        title="Open the job description and requirements"
        className={`cursor-pointer text-left underline-offset-2 hover:text-(--brand) hover:underline focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none ${className ?? ""}`}
      >
        {job.title}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="gap-1.5 border-b border-gray-100 p-5 pr-12">
          <DialogTitle className="text-lg leading-snug font-semibold text-gray-900">{job.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{job.company}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{job.location} · {job.work_mode}</span>
            <span>{job.level}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto p-5">
          <section>
            <h4 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">About the role</h4>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{job.summary}</p>
          </section>
          <JobDetails job={job} />
          <section>
            <h4 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Skills</h4>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <li key={s} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">{s}</li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
