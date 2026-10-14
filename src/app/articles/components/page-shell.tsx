import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeaderControls } from "@/app/restaurant/components/header-controls";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";
import { AdminActions } from "@/app/articles/components/admin-actions";

/** Glass header (same as the lab pages) and a reading-width column; admin buttons show up only when logged in. */
export function PageShell({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className={GLASS_HEADER}>
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3 sm:gap-4 sm:px-6">
          <Link
            href="/"
            aria-label="Back to AI Engineer Lab"
            className="flex shrink-0 items-center gap-1.5 text-sm text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-5 sm:size-4" /> <span className="hidden sm:inline">AI Engineer Lab</span>
          </Link>
          <span className="hidden text-white/40 sm:inline">/</span>
          <h1 className="min-w-0 truncate text-sm font-semibold text-white">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <AdminActions />
            <HeaderControls />
          </div>
        </div>
      </header>
      <main className={wide ? "mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6" : "mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6"}>
        {children}
      </main>
    </div>
  );
}
