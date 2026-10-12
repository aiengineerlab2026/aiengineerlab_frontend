"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";
import type { Dish } from "@/app/restaurant/types/api";

const GRADIENTS = [
  "from-emerald-100 to-green-200",
  "from-lime-100 to-emerald-200",
  "from-amber-100 to-orange-200",
  "from-teal-100 to-cyan-200",
  "from-rose-100 to-orange-200",
  "from-green-100 to-teal-200",
  "from-yellow-100 to-lime-200",
  "from-orange-100 to-red-200",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** The dish photo; the category emoji on a gradient stays as the placeholder while it loads or if it is missing. */
export function DishThumb({ dish, emoji, className }: { dish: Dish; emoji: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-3xl",
        GRADIENTS[hash(dish.category) % GRADIENTS.length],
        !dish.available && "grayscale",
        className,
      )}
    >
      <span aria-hidden>{emoji}</span>
      {dish.image_url && !failed && (
        // eslint-disable-next-line @next/next/no-img-element -- small static photos from /public, no optimizer needed
        <img
          src={dish.image_url}
          alt={dish.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}

export function SpiceLevel({ level }: { level: number }) {
  if (level <= 0) return null;
  return (
    <span className="inline-flex items-center text-orange-500" title={`Spice level ${level}/3`}>
      {Array.from({ length: Math.min(level, 3) }, (_, i) => (
        <Flame key={i} className="size-3" />
      ))}
    </span>
  );
}
