"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Microscope, Plus, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/restaurant/components/ui/button";
import { Input } from "@/app/restaurant/components/ui/input";
import { useEmbeddingChoice } from "@/app/restaurant/hooks/use-rag-config";
import { keys } from "@/app/restaurant/hooks/use-restaurant";
import { errorMessage } from "@/app/restaurant/lib/client";
import { chat } from "@/app/restaurant/lib/endpoints";
import { historyFor, loadChat, saveChat } from "@/app/restaurant/lib/chat-storage";
import { money } from "@/app/restaurant/lib/format";
import { cn } from "@/app/restaurant/lib/utils";
import { useLabStore } from "@/app/restaurant/stores/lab-store";
import type { ChatMessage, ChatUsage, Dish, Order, RetrievalTrace } from "@/app/restaurant/types/api";
import { DishThumb } from "./dish-visual";

const SUGGESTIONS = [
  "High-protein chicken under $20",
  "Vegetarian dishes under 200 calories",
  "Spicy dishes without peanuts",
  "What is in the Tiramisu?",
];

interface Props {
  sessionId: string;
  dishById: Map<string, Dish>;
  emojiOf: Map<string, string>;
  onOpenDish: (dish: Dish) => void;
  onAdd: (dish: Dish) => void;
  onOrderPlaced: (order: Order) => void;
}

export function traceOf(m: ChatMessage): RetrievalTrace | null {
  const t = m.metadata?.trace;
  return t && typeof t === "object" ? (t as RetrievalTrace) : null;
}

function recommendedOf(m: ChatMessage): string[] {
  const ids = m.metadata?.recommended_dish_ids;
  return Array.isArray(ids) ? (ids as string[]) : [];
}

/** Message budget, so customers know up front how many questions they can ask. */
function UsageNotice({ usage }: { usage: ChatUsage }) {
  const { limit, remaining } = usage;
  const out = remaining <= 0;
  const low = remaining <= 1;
  return (
    <div
      role="status"
      className={cn(
        "space-y-1 border-t px-4 pt-2 text-[11px]",
        out ? "text-red-700" : low ? "text-amber-700" : "text-muted-foreground",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{out ? "Message limit reached" : `${remaining} of ${limit} messages left`}</span>
        <span>{out ? "Free version of Gemini" : `Maximum ${limit} messages`}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-all", out ? "bg-red-500" : low ? "bg-amber-500" : "bg-brand")}
          style={{ width: `${Math.max(0, Math.min(1, remaining / limit)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function ChatView({ sessionId, dishById, emojiOf, onOpenDish, onAdd, onOrderPlaced }: Props) {
  const qc = useQueryClient();
  const inspect = useLabStore((s) => s.inspect);
  const setPanelTab = useLabStore((s) => s.setPanelTab);
  const [draft, setDraft] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // The conversation lives in this browser only (localStorage); the backend never stores it.
  const [list, setList] = useState<ChatMessage[]>(() => loadChat(sessionId));

  const usage = useQuery({
    queryKey: keys.chatUsage,
    queryFn: chat.usage,
    // While locked out, poll so the box re-enables by itself once the window frees a slot.
    refetchInterval: (q) => (q.state.data && q.state.data.enabled && q.state.data.remaining <= 0 ? 15_000 : false),
  });
  const limited = !!usage.data?.enabled && usage.data.remaining <= 0;

  const embedding = useEmbeddingChoice();
  const send = useMutation({
    mutationFn: (text: string) => chat.send(sessionId, text, historyFor(list), embedding.chosen),
    onMutate: (text) => setPendingText(text),
    onSuccess: (res, text) => {
      const next = [...list, res.user_message, res.assistant_message];
      setList(next);
      saveChat(sessionId, next);
      qc.setQueryData(keys.cart(sessionId), res.cart);
      const trace = traceOf(res.assistant_message);
      if (trace) inspect({ trace, source: "chat", label: text });
      if (res.order) onOrderPlaced(res.order);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
    onSettled: () => {
      setPendingText(null);
      qc.invalidateQueries({ queryKey: keys.chatUsage });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [list.length, pendingText]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || send.isPending || limited) return;
    setDraft("");
    send.mutate(t);
  }

  const showSuggestions = list.length <= 1 && !pendingText && !limited;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {list.map((m) => {
          const mine = m.role === "user";
          const trace = traceOf(m);
          const dishes = recommendedOf(m)
            .map((id) => dishById.get(id))
            .filter((d): d is Dish => !!d);
          return (
            <div key={m.id} className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                  mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-slate-100 text-slate-900",
                )}
              >
                {m.content}
              </div>

              {dishes.length > 0 && (
                <div className="w-[92%] space-y-1.5">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenDish(dish)}
                      onKeyDown={(e) => e.key === "Enter" && onOpenDish(dish)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white p-2 shadow-xs hover:shadow-md"
                    >
                      <DishThumb dish={dish} emoji={emojiOf.get(dish.category) ?? "🍽️"} className="size-12 text-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{dish.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {money(dish.price, dish.currency)} · {dish.calories} kcal · {dish.protein_grams} g
                        </div>
                      </div>
                      {dish.available && (
                        <Button
                          size="icon-sm"
                          className="rounded-full"
                          aria-label={`Add ${dish.name} to cart`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdd(dish);
                          }}
                        >
                          <Plus />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!mine && trace && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] font-medium text-brand-dark hover:underline"
                  onClick={() => {
                    inspect({
                      trace,
                      source: "chat",
                      label: list[list.indexOf(m) - 1]?.content ?? trace.query,
                    });
                    setPanelTab("inspector");
                  }}
                >
                  <Microscope className="size-3" /> Inspect retrieval
                </button>
              )}
            </div>
          );
        })}

        {pendingText && (
          <>
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-sm text-white">
                {pendingText}
              </div>
            </div>
            <div className="flex">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="shrink-0 rounded-full border border-brand/40 bg-brand-light/60 px-3 py-1 text-xs text-brand-dark hover:bg-brand-light"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {usage.data?.enabled && <UsageNotice usage={usage.data} />}
      <form
        className={cn("flex items-center gap-2 p-3", !usage.data?.enabled && "border-t")}
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={limited ? "Message limit reached" : "Ask for a recommendation or order…"}
          disabled={limited}
          maxLength={2000}
          className="h-10 rounded-full"
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon-lg"
          className="rounded-full"
          disabled={!draft.trim() || send.isPending || limited}
          aria-label="Send"
        >
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}
