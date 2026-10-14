"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { HeaderControls } from "@/app/restaurant/components/header-controls";
import { GLASS_HEADER } from "@/app/restaurant/lib/header-style";
import { cn } from "@/app/restaurant/lib/utils";

const NAV = [
  { href: "/", label: "Applications", active: (path: string) => path === "/" },
  { href: "/articles", label: "Articles", active: (path: string) => path.startsWith("/articles") },
];

/**
 * Site-wide top bar. Left: logo, title and the primary links (ghost links with an underline on the current page).
 * Right: the utility controls (brand color, light / dark), preceded by any page specific `actions`.
 */
export function SiteHeader({ actions }: { actions?: React.ReactNode }) {
  const path = usePathname();
  return (
    <header className={GLASS_HEADER}>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <Link
            href="/"
            aria-label="AI Engineer Lab, home"
            className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            <span aria-hidden className="flex size-9 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-white">
              <FlaskConical className="size-5" />
            </span>
            <span className="hidden text-base font-bold tracking-tight whitespace-nowrap text-white min-[480px]:block sm:text-lg">
              AI Engineer Lab
            </span>
          </Link>

          <nav aria-label="Primary" className="ml-1 flex items-center gap-0.5 sm:ml-3">
            {NAV.map(({ href, label, active }) => {
              const current = active(path);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-md px-2.5 text-sm font-medium transition-colors sm:px-3",
                    "focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none",
                    current
                      ? "font-semibold text-white after:absolute after:inset-x-2.5 after:-bottom-2.5 after:h-0.5 after:rounded-full after:bg-white sm:after:inset-x-3"
                      : "text-white/80 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {actions}
          <HeaderControls />
        </div>
      </div>
    </header>
  );
}
