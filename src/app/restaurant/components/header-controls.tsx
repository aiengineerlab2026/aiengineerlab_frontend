"use client";

import { Palette } from "lucide-react";
import { BrandSwitcher } from "@/app/restaurant/components/brand-switcher";
import { ThemeSwitcher } from "@/app/restaurant/components/theme-switcher";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/restaurant/components/ui/popover";
import { GLASS_BUTTON } from "@/app/restaurant/lib/header-style";
import { cn } from "@/app/restaurant/lib/utils";

/**
 * Brand color + light/dark controls for the glass header.
 * From `sm` up both sit inline; on phones they collapse into one palette button that opens a small popover,
 * so they can never crowd the logo and title.
 */
export function HeaderControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center", className)}>
      <div className="hidden items-center gap-3 sm:flex">
        <BrandSwitcher />
        <ThemeSwitcher />
      </div>
      <Popover>
        <PopoverTrigger aria-label="Color and theme" title="Color and theme" className={cn(GLASS_BUTTON, "sm:hidden")}>
          <Palette className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-auto flex-row items-center gap-3 border border-white/30 bg-(--brand-solid) p-2.5 text-white ring-0"
        >
          <BrandSwitcher />
          <ThemeSwitcher />
        </PopoverContent>
      </Popover>
    </div>
  );
}
