"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/app/restaurant/lib/init-script";
import { cn } from "@/app/restaurant/lib/utils";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const isDark = () => document.documentElement.classList.contains("dark");

function toggle() {
  const dark = !isDark();
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {}
  listeners.forEach((cb) => cb());
}

/** Header button that switches between the light and dark theme. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/30 bg-white/15 text-white transition-[transform,background-color] duration-100 hover:translate-y-px hover:bg-white/25 active:translate-y-px focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
        className,
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
