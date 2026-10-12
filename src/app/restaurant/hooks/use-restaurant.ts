"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/app/restaurant/lib/client";
import { carts, restaurant } from "@/app/restaurant/lib/endpoints";
import type { Cart, Dish } from "@/app/restaurant/types/api";

export const keys = {
  menu: ["menu"] as const,
  categories: ["categories"] as const,
  cart: (sid: string) => ["cart", sid] as const,
  chatUsage: ["chat-usage"] as const,
  strategies: ["strategies"] as const,
  models: ["models"] as const,
  config: ["rag-config"] as const,
  indexStatus: ["index-status"] as const,
  live: ["live-evaluations"] as const,
};

export function useMenu() {
  const query = useQuery({ queryKey: keys.menu, queryFn: () => restaurant.menu(), staleTime: 5 * 60_000 });
  const dishById = useMemo(() => new Map<string, Dish>((query.data?.dishes ?? []).map((d) => [d.id, d])), [query.data]);
  return { ...query, dishById };
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: restaurant.categories, staleTime: 5 * 60_000 });
}

export function useCart(sessionId: string | null) {
  return useQuery({
    queryKey: keys.cart(sessionId ?? ""),
    queryFn: () => carts.get(sessionId!),
    enabled: !!sessionId,
  });
}

/** Cart mutations. The server owns all cart rules; the UI only reflects the returned cart. */
export function useCartActions(sessionId: string | null) {
  const qc = useQueryClient();
  const setCart = (cart: Cart) => qc.setQueryData(keys.cart(cart.session_id), cart);
  const onError = (e: unknown) => toast.error(errorMessage(e));

  const add = useMutation({
    mutationFn: ({ dish, quantity = 1 }: { dish: Dish; quantity?: number }) =>
      carts.add(sessionId!, dish.id, quantity),
    onSuccess: (cart, { dish }) => {
      setCart(cart);
      toast.success(`${dish.name} added to cart`, { duration: 1800 });
    },
    onError,
  });
  const setQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      carts.setQuantity(sessionId!, itemId, quantity),
    onSuccess: setCart,
    onError,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => carts.remove(sessionId!, itemId),
    onSuccess: setCart,
    onError,
  });
  return { add, setQuantity, remove };
}
