"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, RotateCcw, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/restaurant/components/ui/button";
import { keys, useCart, useCartActions, useCategories, useMenu } from "@/app/restaurant/hooks/use-restaurant";
import { useSessionId } from "@/app/restaurant/hooks/use-session-id";
import { errorMessage } from "@/app/restaurant/lib/client";
import { orders } from "@/app/restaurant/lib/endpoints";
import { loadChat } from "@/app/restaurant/lib/chat-storage";
import { cn } from "@/app/restaurant/lib/utils";
import { useLabStore } from "@/app/restaurant/stores/lab-store";
import type { Dish, Order } from "@/app/restaurant/types/api";
import { CartView } from "./cart-view";
import { ChatView, traceOf } from "./chat-view";
import { DishDetail } from "./dish-detail";
import { MenuView } from "./menu-view";
import { OrderConfirmation } from "./order-confirmation";
import { PhoneFrame } from "./phone-frame";

type Screen = "menu" | "chat" | "cart";

const TABS: { id: Screen; label: string; icon: typeof Bot }[] = [
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "chat", label: "Assistant", icon: Bot },
  { id: "cart", label: "Cart", icon: ShoppingBag },
];

export function RestaurantSimulator() {
  const qc = useQueryClient();
  const { sessionId, error: sessionError, reset } = useSessionId();
  const menu = useMenu();
  const categories = useCategories();
  const cart = useCart(sessionId);
  const { add, setQuantity, remove } = useCartActions(sessionId);

  // After a reload, show the latest retrieval of this session (read from this browser) in the Retrieval Inspector.
  const inspect = useLabStore((s) => s.inspect);
  const hasInspected = useLabStore((s) => s.inspected !== null);
  useEffect(() => {
    if (hasInspected || !sessionId) return;
    const saved = loadChat(sessionId);
    for (let i = saved.length - 1; i >= 0; i--) {
      const trace = saved[i].role === "assistant" ? traceOf(saved[i]) : null;
      if (trace) {
        inspect({ trace, source: "chat", label: saved[i - 1]?.content ?? trace.query });
        break;
      }
    }
  }, [sessionId, hasInspected, inspect]);

  const [screen, setScreen] = useState<Screen>("chat");
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const emojiOf = useMemo(() => new Map((categories.data ?? []).map((c) => [c.name, c.emoji])), [categories.data]);

  const place = useMutation({
    mutationFn: () => orders.place(sessionId!),
    onSuccess: (o) => handleOrderPlaced(o),
    onError: (e) => toast.error(errorMessage(e)),
  });

  function handleOrderPlaced(o: Order) {
    setOrder(o);
    setOpenDish(null);
    qc.invalidateQueries({ queryKey: keys.cart(o.session_id) });
  }

  async function startOver() {
    try {
      await reset();
      qc.removeQueries({ queryKey: ["cart"] });
      setOrder(null);
      setOpenDish(null);
      setScreen("chat");
      toast.success("Started a new session");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const itemCount = cart.data?.item_count ?? 0;
  const addingDishId = add.isPending ? add.variables?.dish.id ?? null : null;
  const cartBusy = setQuantity.isPending || remove.isPending;

  return (
    <div className="flex flex-col items-center gap-3">
      <PhoneFrame>
        <header className="flex items-center justify-between bg-brand-dark px-4 pt-8 pb-3 text-white">
          <div>
            <div className="text-base leading-tight font-semibold">{menu.data?.restaurant.name ?? "\u00a0"}</div>
            <div className="min-h-4 text-[11px] text-white/80">{menu.data?.restaurant.tagline}</div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={startOver}
            aria-label="Start a new session"
            title="Start a new session"
          >
            <RotateCcw />
          </Button>
        </header>

        {sessionError ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-red-700">
            {sessionError}
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col pt-3">
            {screen === "menu" && (
              <MenuView
                dishes={menu.data?.dishes}
                categories={categories.data}
                loading={menu.isLoading}
                error={menu.error ? errorMessage(menu.error) : null}
                onOpenDish={setOpenDish}
                onAdd={(dish) => add.mutate({ dish })}
                addingDishId={addingDishId}
              />
            )}
            {screen === "chat" && sessionId && (
              <ChatView
                key={sessionId}
                sessionId={sessionId}
                dishById={menu.dishById}
                emojiOf={emojiOf}
                onOpenDish={setOpenDish}
                onAdd={(dish) => add.mutate({ dish })}
                onOrderPlaced={handleOrderPlaced}
              />
            )}
            {screen === "cart" && (
              <CartView
                cart={cart.data}
                busy={cartBusy}
                placing={place.isPending}
                onSetQuantity={(itemId, quantity) => setQuantity.mutate({ itemId, quantity })}
                onRemove={(itemId) => remove.mutate(itemId)}
                onPlaceOrder={() => place.mutate()}
                onBrowse={() => setScreen("menu")}
              />
            )}
          </div>
        )}

        <nav className="grid grid-cols-3 border-t bg-white pb-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setScreen(id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                screen === id ? "text-brand" : "text-slate-500 hover:text-slate-800",
              )}
              aria-current={screen === id ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="size-5" />
                {id === "cart" && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4 text-white">
                    {itemCount}
                  </span>
                )}
              </span>
              {label}
            </button>
          ))}
        </nav>

        {openDish && (
          <DishDetail
            key={openDish.id}
            dish={openDish}
            emoji={emojiOf.get(openDish.category) ?? "🍽️"}
            adding={add.isPending}
            onClose={() => setOpenDish(null)}
            onAdd={(dish, quantity) => add.mutate({ dish, quantity }, { onSuccess: () => setOpenDish(null) })}
          />
        )}
        {order && (
          <OrderConfirmation
            order={order}
            onDone={() => {
              setOrder(null);
              setScreen("menu");
            }}
          />
        )}
      </PhoneFrame>
    </div>
  );
}
