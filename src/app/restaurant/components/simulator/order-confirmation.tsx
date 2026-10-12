import { CheckCircle2 } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { money } from "@/app/restaurant/lib/format";
import type { Order } from "@/app/restaurant/types/api";

export function OrderConfirmation({ order, onDone }: { order: Order; onDone: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-card">
      <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-6 pt-14 pb-4 text-center">
        <CheckCircle2 className="size-16 text-brand" />
        <div>
          <h2 className="text-xl font-semibold text-brand-dark">Order confirmed</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            #{order.id.slice(0, 8).toUpperCase()} · demo order, nothing was charged
          </p>
        </div>
        <div className="w-full space-y-2 rounded-2xl border p-4 text-left">
          {order.items.map((i) => (
            <div key={i.dish_id} className="flex justify-between gap-3 text-sm">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span className="tabular-nums">{money(i.line_total, order.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span className="text-brand-dark">{money(order.total, order.currency)}</span>
          </div>
        </div>
      </div>
      <div className="border-t p-4">
        <Button className="h-11 w-full rounded-full" onClick={onDone}>
          Back to menu
        </Button>
      </div>
    </div>
  );
}
