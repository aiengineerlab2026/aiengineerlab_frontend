import { createElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Plus, ServerCrash } from "lucide-react";
import { GithubIcon } from "@/app/restaurant/components/github-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/restaurant/components/ui/tooltip";
import { appIcon } from "@/app/restaurant/lib/app-icons";
import { API_BASE_URL } from "@/app/restaurant/lib/client";
import { RESTAURANT_GITHUB_URL } from "@/app/restaurant/lib/links";
import { MYRESUME_GITHUB_URL } from "@/app/myresume/lib/links";
import { cn } from "@/app/restaurant/lib/utils";
import type { AppInfo } from "@/app/restaurant/types/api";

/** Custom artwork per app id; apps without one fall back to their icon. */
const LOGOS: Record<string, string> = { restaurant: "/restaurant-logo.jpg" };

/** Where each app lives in this frontend; takes precedence over the route the backend reports (older backends say /apps/restaurant). */
const ROUTES: Record<string, string> = { restaurant: "/restaurant", myresume: "/test-resume-job-match", "country-matcher": "/country-matcher" };

/** Source repository per app id (the URLs come from env, see lib/links.ts). */
const GITHUB_URLS: Record<string, string | undefined> = { restaurant: RESTAURANT_GITHUB_URL, myresume: MYRESUME_GITHUB_URL };

/** Grid columns on large screens; placeholders fill the last row so a single app doesn't look lost. */
const COLUMNS = 3;

// Paper palette: warm off-white sheet, hairline ink borders, print green.
const PAPER = "bg-(--paper)";
const HAIRLINE = "border border-(color:--hair)";

function AppCard({ app }: { app: AppInfo }) {
  const logo = LOGOS[app.id];
  const github = GITHUB_URLS[app.id];
  const disabled = app.status !== "active";
  const action = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-[transform,box-shadow,background-color] duration-100",
    "hover:translate-y-px active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-(color:--paper) focus-visible:outline-none",
  );
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col justify-between rounded-xl p-6 transition-shadow duration-200",
        PAPER,
        HAIRLINE,
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_14px_28px_-6px_rgba(0,0,0,0.09)]",
        // Full-width green accent along the top edge; overflow-hidden clips it to the rounded corners.
        "overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-(--brand) before:via-(--brand-bright) before:to-(--brand)",
      )}
    >
      {github && !disabled && (
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${app.name} source on GitHub`}
              />
            }
            className={cn(
              "absolute top-5 right-5 inline-flex size-9 items-center justify-center rounded-lg border border-(color:--hair-strong) text-(color:--ink) transition-[transform,background-color] duration-100",
              PAPER,
              "hover:translate-y-px hover:border-(color:--hair-strong) hover:bg-(--paper-sunk) active:translate-y-px focus-visible:ring-2 focus-visible:ring-(color:--ink-mute) focus-visible:ring-offset-2 focus-visible:ring-offset-(color:--paper) focus-visible:outline-none",
            )}
          >
            <GithubIcon className="size-[18px]" />
          </TooltipTrigger>
          <TooltipContent side="top">View source on GitHub</TooltipContent>
        </Tooltip>
      )}
      <div>
        <div className={cn("mb-5 flex size-20 items-center justify-center overflow-hidden rounded-lg bg-(--paper-sunk)", HAIRLINE)}>
          {logo ? (
            <Image src={logo} alt={`${app.name} logo`} width={160} height={160} unoptimized className="h-full w-full scale-[1.32] object-contain" />
          ) : (
            createElement(appIcon(app.icon), { className: "h-full w-full p-4 text-(--brand)" })
          )}
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-(color:--ink)">{app.name}</h3>
        <p className="mb-6 flex-grow text-xs leading-relaxed text-(color:--ink-2) sm:text-sm">{app.description}</p>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {app.tags.map((tag) => (
            <span
              key={tag}
              className={cn("rounded-full bg-(--paper-alt) px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-(color:--ink-3)", HAIRLINE)}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {disabled ? (
        <span className={cn("pointer-events-none mx-auto flex w-[90%] justify-center rounded-lg bg-(--paper-alt) px-4 py-3 text-sm font-semibold text-(color:--ink-mute)", HAIRLINE)}>
          Coming soon
        </span>
      ) : (
        <Link
          href={ROUTES[app.id] ?? app.route}
          className={cn(
            action,
            "group/open mx-auto flex w-[90%] bg-(--brand) text-white shadow-[0_2px_0_var(--brand-dark)] hover:bg-(--brand-hover) hover:shadow-[0_1px_0_var(--brand-dark)] active:shadow-none",
            "focus-visible:ring-(--brand)",
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
        "flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-(color:--dash) bg-(--paper-soft) p-6 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-lg border border-dashed border-(color:--dash) bg-(--paper) text-(color:--ink-mute)">
        <Plus className="size-5" />
      </div>
      <p className="text-sm font-semibold text-(color:--ink-mute)">New Lab Coming Soon</p>
      <p className="mt-1 max-w-48 text-xs text-(color:--ink-mute)/80">Another AI application to tune and measure will appear here.</p>
    </div>
  );
}

export function Applications({ apps, error }: { apps: AppInfo[]; error: string | null }) {
  const placeholders = Math.max(0, COLUMNS - apps.length);
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-(color:--ink-mute) uppercase">
        <Layers className="size-3.5" /> Applications
      </h2>
      <p className="mb-6 text-sm text-(color:--ink-mute)">Explore different AI engineering concepts and features.</p>

      {error ? (
        <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-red-700">
            <ServerCrash className="size-5" /> Can&apos;t reach the backend
          </h3>
          <p className="mt-1 text-sm text-red-600/90">{error}</p>
          <p className="mt-3 text-sm text-slate-600">
            Start it with <code className="rounded bg-card px-1.5 py-0.5">uvicorn app.main:app --port 8000</code> in{" "}
            <code className="rounded bg-card px-1.5 py-0.5">backend/</code>, then refresh. The frontend is configured for{" "}
            <code className="rounded bg-card px-1.5 py-0.5">{API_BASE_URL}</code>.
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
