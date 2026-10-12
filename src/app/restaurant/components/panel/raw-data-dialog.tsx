"use client";

import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/restaurant/components/ui/dialog";
import { Input } from "@/app/restaurant/components/ui/input";
import { Skeleton } from "@/app/restaurant/components/ui/skeleton";
import { useMenu } from "@/app/restaurant/hooks/use-restaurant";
import { errorMessage } from "@/app/restaurant/lib/client";
import { money } from "@/app/restaurant/lib/format";
import type { Dish } from "@/app/restaurant/types/api";
import { Pill } from "./config-ui";

/** "Show raw data" button + centered dialog listing the dishes as stored, before they are chunked and embedded. */
export function RawDataButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menu = useMenu();
  const dishes = menu.data?.dishes;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!dishes || !q) return dishes ?? [];
    return dishes.filter((d) =>
      [d.name, d.category, d.description, d.ingredients.join(" "), d.allergens.join(" "), d.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [dishes, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <FileText /> Show raw data
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Raw data · {dishes ? `${dishes.length} dishes` : "dishes"}</DialogTitle>
          <DialogDescription>The menu as stored, before each dish is chunked and embedded.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, category, ingredient…"
            className="pl-8"
            aria-label="Search dishes"
          />
        </div>

        <div className="-mx-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-1">
          {menu.isLoading &&
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          {menu.error && <p className="text-sm text-red-600">{errorMessage(menu.error)}</p>}
          {dishes && shown.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No dishes match.</p>}
          {shown.map((d) => (
            <DishRow key={d.id} dish={d} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-medium text-gray-700">{label}: </span>
      {children}
    </div>
  );
}

function DishRow({ dish: d }: { dish: Dish }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{d.name}</h3>
        <Pill>{d.category}</Pill>
        <Pill tone="success">{money(d.price, d.currency)}</Pill>
        {!d.available && <Pill tone="warning">Unavailable</Pill>}
        <span className="ml-auto font-mono text-[11px] text-gray-400">{d.id}</span>
      </div>
      <div className="space-y-0.5">
        <p>{d.description}</p>
        <Field label="Ingredients">{d.ingredients.join(", ") || "—"}</Field>
        <Field label="Allergens">{d.allergens.join(", ") || "none"}</Field>
        <Field label="Nutrition">
          {d.calories} kcal · {d.protein_grams} g protein
        </Field>
        <Field label="Spice level">{d.spice_level}</Field>
        {d.tags.length > 0 && <Field label="Tags">{d.tags.join(", ")}</Field>}
      </div>
    </article>
  );
}
