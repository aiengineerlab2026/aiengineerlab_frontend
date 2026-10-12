"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { money } from "@/app/restaurant/lib/format";
import type { Cart } from "@/app/restaurant/types/api";

interface Props {
  cart: Cart | undefined;
  busy: boolean;
  placing: boolean;
  onSetQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPlaceOrder: () => void;
  onBrowse: () => void;
}

export function CartView({ cart, busy, placing, onSetQuantity, onRemove, onPlaceOrder, onBrowse }: Props) {
  const [confirming, setConfirming] = useState(false);
  const items = cart?.items ?? [];

  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-light text-brand-dark">
          <ShoppingBag className="size-8" />
        </div>
        <h3 className="font-semibold">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground">Browse the menu, or ask the assistant to add something.</p>
        <Button variant="outline" className="rounded-full" onClick={onBrowse}>
          Browse the menu
        </Button>
      </div>
    );
  }

  const currency = cart?.currency ?? "USD";
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {money(item.unit_price, currency)} · {item.category}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="rounded-full"
                  aria-label={`Decrease ${item.name}`}
                  disabled={busy || item.quantity <= 1}
                  onClick={() => onSetQuantity(item.id, item.quantity - 1)}
                >
                  <Minus />
                </Button>
                <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="rounded-full"
                  aria-label={`Increase ${item.name}`}
                  disabled={busy || item.quantity >= 20}
                  onClick={() => onSetQuantity(item.id, item.quantity + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm font-semibold text-brand-dark">{money(item.line_total, currency)}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${item.name}`}
                disabled={busy}
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total ({cart?.item_count} items)</span>
          <span className="text-lg font-semibold text-brand-dark">{money(cart?.total ?? 0, currency)}</span>
        </div>
        <Button className="h-11 w-full rounded-full text-base" onClick={() => setConfirming(true)}>
          Place order
        </Button>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-10 flex items-end bg-black/40">
          <div className="w-full space-y-3 rounded-t-3xl bg-card p-5">
            <h3 className="text-lg font-semibold">Confirm your order?</h3>
            <p className="text-sm text-muted-foreground">
              {cart?.item_count} items for <strong>{money(cart?.total ?? 0, currency)}</strong>. This is a demo: nothing
              is charged or delivered.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 flex-1 rounded-full" onClick={() => setConfirming(false)}>
                Not yet
              </Button>
              <Button
                className="h-10 flex-1 rounded-full"
                disabled={placing}
                onClick={() => {
                  setConfirming(false);
                  onPlaceOrder();
                }}
              >
                Yes, confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
