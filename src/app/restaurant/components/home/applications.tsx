import { createElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Plus, ServerCrash } from "lucide-react";
import { appIcon } from "@/app/restaurant/lib/app-icons";
import { API_BASE_URL } from "@/app/restaurant/lib/client";
import { cn } from "@/app/restaurant/lib/utils";
import type { AppInfo } from "@/app/restaurant/types/api";

/** Custom artwork per app id; apps without one fall back to their icon. */
const LOGOS: Record<string, string> = { restaurant: "/restaurant-logo.jpg" };

/** Where each app lives in this frontend; takes precedence over the route the backend reports (older backends say /apps/restaurant). */
const ROUTES: Record<string, string> = { restaurant: "/restaurant" };

/** Grid columns on large screens; placeholders fill the last row so a single app doesn't look lost. */
const COLUMNS = 3;

function AppCard({ app }: { app: AppInfo }) {
  const logo = LOGOS[app.id];
  const disabled = app.status !== "active";
  const action =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition-all duration-150";
  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/10">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 opacity-70 transition-opacity group-hover:opacity-100"
      />
      <div>
        <div className="mb-5 flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 shadow-md shadow-emerald-900/10 ring-4 ring-emerald-50 transition-all group-hover:scale-105 group-hover:bg-emerald-100/60 group-hover:ring-emerald-100">
          {logo ? (
            <Image src={logo} alt={`${app.name} logo`} width={160} height={160} unoptimized className="h-full w-full scale-[1.32] object-contain" />
          ) : (
            createElement(appIcon(app.icon), { className: "h-full w-full p-4 text-emerald-700" })
          )}
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700">{app.name}</h3>
        <p className="mb-6 flex-grow text-xs leading-relaxed text-slate-500 sm:text-sm">{app.description}</p>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {app.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-100/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {disabled ? (
        <span className={cn(action, "pointer-events-none border border-slate-200 bg-slate-50 text-slate-400 shadow-none")}>
          Coming soon
        </span>
      ) : (
        <Link
          href={ROUTES[app.id] ?? app.route}
          className={cn(
            action,
            "group/open py-3 text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-700/25",
            "hover:from-emerald-500 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-700/35",
            "active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none",
          )}
        >
          Open Lab
          <ArrowRight className="size-4 transition-transform duration-150 group-hover/open:translate-x-1" />
        </Link>
      )}
    </article>
  );
}

function PlaceholderCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center opacity-75",
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
        <Plus className="size-5" />
      </div>
      <p className="text-sm font-semibold text-slate-600">New Lab Coming Soon</p>
      <p className="mt-1 max-w-48 text-xs text-slate-400">Another AI application to tune and measure will appear here.</p>
    </div>
  );
}

export function Applications({ apps, error }: { apps: AppInfo[]; error: string | null }) {
  const placeholders = Math.max(0, COLUMNS - apps.length);
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <h2 className="mb-6 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
        <Layers className="size-3.5" /> Applications
      </h2>

      {error ? (
        <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-red-700">
            <ServerCrash className="size-5" /> Can&apos;t reach the backend
          </h3>
          <p className="mt-1 text-sm text-red-600/90">{error}</p>
          <p className="mt-3 text-sm text-slate-600">
            Start it with <code className="rounded bg-white px-1.5 py-0.5">uvicorn app.main:app --port 8000</code> in{" "}
            <code className="rounded bg-white px-1.5 py-0.5">backend/</code>, then refresh. The frontend is configured for{" "}
            <code className="rounded bg-white px-1.5 py-0.5">{API_BASE_URL}</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
          {Array.from({ length: placeholders }, (_, i) => (
            // On two columns only one placeholder is needed to complete the row.
            <PlaceholderCard key={i} className={i > 0 ? "hidden lg:flex" : undefined} />
          ))}
        </div>
      )}
    </section>
  );
}
