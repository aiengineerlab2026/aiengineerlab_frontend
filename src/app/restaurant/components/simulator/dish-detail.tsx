"use client";

import { AlertTriangle, ChevronLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/app/restaurant/components/ui/badge";
import { Button } from "@/app/restaurant/components/ui/button";
import { money, titleCase } from "@/app/restaurant/lib/format";
import type { Dish } from "@/app/restaurant/types/api";
import { DishThumb, SpiceLevel } from "./dish-visual";

interface Props {
  dish: Dish;
  emoji: string;
  adding: boolean;
  onClose: () => void;
  onAdd: (dish: Dish, quantity: number) => void;
}

export function DishDetail({ dish, emoji, adding, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1);
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="relative">
        <DishThumb dish={dish} emoji={emoji} className="h-52 w-full rounded-none text-7xl" />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-8 left-3 rounded-full bg-white/90"
          onClick={onClose}
          aria-label="Back to menu"
        >
          <ChevronLeft />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{dish.name}</h2>
            <div className="text-lg font-semibold whitespace-nowrap text-brand-dark">
              {money(dish.price, dish.currency)}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{dish.category}</span>
            <SpiceLevel level={dish.spice_level} />
            {dish.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {titleCase(t)}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-600">{dish.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-brand-light p-3">
            <div className="text-lg font-semibold text-brand-dark">{dish.calories}</div>
            <div className="text-[11px] text-brand-dark/80">calories</div>
          </div>
          <div className="rounded-xl bg-brand-light p-3">
            <div className="text-lg font-semibold text-brand-dark">{dish.protein_grams} g</div>
            <div className="text-[11px] text-brand-dark/80">protein</div>
          </div>
        </div>

        <section>
          <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ingredients</h3>
          <p className="text-sm text-slate-700">{dish.ingredients.join(", ")}</p>
        </section>

        <section>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <AlertTriangle className="size-3.5" /> Allergens
          </h3>
          {dish.allergens.length ? (
            <div className="flex flex-wrap gap-1.5">
              {dish.allergens.map((a) => (
                <Badge key={a} variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                  {titleCase(a)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-700">None of the tracked allergens.</p>
          )}
        </section>
      </div>

      <div className="flex items-center gap-3 border-t p-4">
        {dish.available ? (
          <>
            <div className="flex items-center gap-1 rounded-full border p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                onClick={() => setQty((q) => q - 1)}
              >
                <Minus />
              </Button>
              <span className="w-6 text-center text-sm font-medium tabular-nums">{qty}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label="Increase quantity"
                disabled={qty >= 20}
                onClick={() => setQty((q) => q + 1)}
              >
                <Plus />
              </Button>
            </div>
            <Button className="h-10 flex-1 rounded-full" disabled={adding} onClick={() => onAdd(dish, qty)}>
              Add · {money(dish.price * qty, dish.currency)}
            </Button>
          </>
        ) : (
          <p className="w-full rounded-xl bg-slate-100 p-3 text-center text-sm text-slate-600">
            This dish is currently unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
