import type { Job } from "@/app/myresume/types/api";

function Block({ title, items, strong }: { title: string; items: string[]; strong?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{title}</h4>
      <ul className={`mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed marker:text-(--brand) ${strong ? "text-gray-800" : "text-gray-600"}`}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/** The long part of a posting, laid out like a LinkedIn job: experience, responsibilities, required qualifications, nice to have. */
export function JobDetails({ job }: { job: Job }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-700">
        <span className="font-semibold">Experience:</span> {job.experience}
      </p>
      <Block title="Responsibilities" items={job.responsibilities} />
      <Block title="Required qualifications" items={job.qualifications} strong />
      <Block title="Nice to have" items={job.nice_to_have} />
    </div>
  );
}
