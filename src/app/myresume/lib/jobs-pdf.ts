import type { Job } from "@/app/myresume/types/api";

// jsPDF's built-in fonts only cover Latin-1: map the usual typographic characters and drop the rest.
const latin1 = (s: string) =>
  s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\n\x20-\xFF]/g, "?");

/** Download the job list as a PDF: one block per job (title, details, summary, skills, responsibilities, qualifications). jsPDF is loaded only when asked for. */
export async function downloadJobsPdf(jobs: Job[]): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const write = (text: string, opts: { size?: number; bold?: boolean; gray?: boolean; indent?: number; gap?: number } = {}) => {
    const { size = 10, bold = false, gray = false, indent = 0, gap = 4 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size);
    if (gray) doc.setTextColor(110);
    else doc.setTextColor(25);
    const lines = doc.splitTextToSize(latin1(text), W - 2 * M - indent) as string[];
    const lh = size * 1.3;
    for (const line of lines) {
      if (y + lh > H - M) {
        doc.addPage();
        y = M;
      }
      doc.text(line, M + indent, (y += lh));
    }
    y += gap;
  };
  const list = (title: string, items: string[]) => {
    if (items.length === 0) return;
    write(title, { bold: true, size: 9, gray: true, gap: 1 });
    for (const t of items) write(`- ${t}`, { indent: 8, gap: 1 });
    y += 4;
  };

  write("Job postings", { size: 20, bold: true, gap: 2 });
  write(`${jobs.length} jobs - exported ${new Date().toLocaleDateString()}`, { gray: true, gap: 14 });

  jobs.forEach((j, i) => {
    if (i > 0) {
      y += 6;
      if (y > H - M - 80) {
        doc.addPage();
        y = M;
      } else {
        doc.setDrawColor(220).line(M, y, W - M, y);
        y += 10;
      }
    }
    write(`${i + 1}. ${j.title}`, { size: 13, bold: true, gap: 2 });
    write(`${j.company} | ${j.location} | ${j.work_mode} | ${j.level} | ${j.experience}`, { gray: true, gap: 6 });
    write(j.summary, { gap: 6 });
    write(`Skills: ${j.skills.join(", ")}`, { gap: 6 });
    list("Responsibilities", j.responsibilities);
    list("Required qualifications", j.qualifications);
    list("Nice to have", j.nice_to_have);
  });

  doc.save("job-postings.pdf");
}
