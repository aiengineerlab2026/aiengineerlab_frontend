"use client";

import { useEffect, useSyncExternalStore } from "react";
import { setFavicon } from "@/app/restaurant/lib/favicon";
import { BRAND_STORAGE_KEY as STORAGE_KEY } from "@/app/restaurant/lib/init-script";
import { cn } from "@/app/restaurant/lib/utils";

const BRANDS = [
  { id: "green", label: "Green", swatch: "bg-green-500" },
  { id: "blue", label: "Blue", swatch: "bg-blue-500" },
  { id: "red", label: "Red", swatch: "bg-red-500" },
] as const;
type Brand = (typeof BRANDS)[number]["id"];

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const current = (): Brand => (document.documentElement.dataset.brand as Brand | undefined) ?? "green";

function setBrand(brand: Brand) {
  document.documentElement.dataset.brand = brand;
  try {
    localStorage.setItem(STORAGE_KEY, brand);
  } catch {}
  listeners.forEach((cb) => cb());
}

/** Header control to recolor the whole UI: three swatches, the active one gets a white ring. */
export function BrandSwitcher({ className }: { className?: string }) {
  const brand = useSyncExternalStore(subscribe, current, () => "green" as Brand);
  // Keep the tab icon in the selected color: on load (the saved choice) and on every change.
  useEffect(() => setFavicon(brand), [brand]);
  return (
    <div role="radiogroup" aria-label="Theme color" className={cn("flex items-center gap-1.5", className)}>
      {BRANDS.map((b) => (
        <button
          key={b.id}
          type="button"
          role="radio"
          aria-checked={brand === b.id}
          aria-label={b.label}
          title={b.label}
          onClick={() => setBrand(b.id)}
          className={cn(
            "size-5 cursor-pointer rounded-full border border-white/50 transition-[transform,box-shadow] duration-100 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
            b.swatch,
            brand === b.id && "ring-2 ring-white ring-offset-1 ring-offset-black/20",
          )}
        />
      ))}
    </div>
  );
}
