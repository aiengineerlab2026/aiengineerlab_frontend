"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { Input } from "@/app/restaurant/components/ui/input";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { money } from "@/app/restaurant/lib/format";
import { cn } from "@/app/restaurant/lib/utils";
import type { Category, Dish } from "@/app/restaurant/types/api";
import { DishThumb, SpiceLevel } from "./dish-visual";

interface Props {
  dishes: Dish[] | undefined;
  categories: Category[] | undefined;
  loading: boolean;
  error: string | null;
  onOpenDish: (dish: Dish) => void;
  onAdd: (dish: Dish) => void;
  addingDishId: string | null;
}

export function MenuView({ dishes, categories, loading, error, onOpenDish, onAdd, addingDishId }: Props) {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const emojiOf = useMemo(() => new Map((categories ?? []).map((c) => [c.name, c.emoji])), [categories]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (dishes ?? []).filter(
      (d) => (category === "All" || d.category === category) && (!q || d.name.toLowerCase().includes(q)),
    );
  }, [dishes, category, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-4 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the menu"
            className="h-9 rounded-full bg-muted/60 pl-9"
            aria-label="Search the menu"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {["All", ...(categories ?? []).map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === name
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-slate-600 hover:bg-brand-light",
              )}
            >
              {name !== "All" && <span className="mr-1">{emojiOf.get(name)}</span>}
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {loading &&
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No dishes match.</p>
        )}
        {visible.map((dish) => (
          <div
            key={dish.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDish(dish)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenDish(dish)}
            className={cn(
              "flex cursor-pointer gap-3 rounded-2xl border bg-white p-2.5 text-left shadow-xs transition-shadow hover:shadow-md",
              !dish.available && "opacity-70",
            )}
          >
            <DishThumb dish={dish} emoji={emojiOf.get(dish.category) ?? "🍽️"} className="size-20" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900">{dish.name}</h3>
                <SpiceLevel level={dish.spice_level} />
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{dish.description}</p>
              <div className="mt-auto flex items-center justify-between pt-1.5">
                <div>
                  <div className="text-sm font-semibold text-brand-dark">{money(dish.price, dish.currency)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {dish.calories} kcal · {dish.protein_grams} g protein
                  </div>
                </div>
                {dish.available ? (
                  <Button
                    size="icon-sm"
                    className="rounded-full"
                    aria-label={`Add ${dish.name} to cart`}
                    disabled={addingDishId === dish.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(dish);
                    }}
                  >
                    <Plus />
                  </Button>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
