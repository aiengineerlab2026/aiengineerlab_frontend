"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Button } from "@/app/restaurant/components/ui/button";
import { TabsTrigger } from "@/app/restaurant/components/ui/tabs";
import { cn } from "@/app/restaurant/lib/utils";
import { useLabStore } from "@/app/restaurant/stores/lab-store";

/**
 * First-visit guide of a lab: one tip per tab, in order (Configuration "modify experiment properties", the Retrieval
 * Inspector where the lab has one, Evaluation "evaluate your results"). The page dims around the tab being explained.
 * Progress is kept per lab in localStorage, so each visitor sees the guide once.
 */
export type GuideStep = "configuration" | "inspector" | "evaluation";
type GuideState = GuideStep | "done";

const MESSAGES: Record<GuideStep, string> = {
  configuration: "Modify experiment properties",
  inspector: "Inspect your flow",
  evaluation: "Evaluate your results",
};

/** The tabs each lab explains, in order. */
const FLOWS: Record<string, GuideStep[]> = {
  restaurant: ["configuration", "inspector", "evaluation"],
  myresume: ["configuration", "evaluation"],
};

const storageKey = (project: string) => `rag-lab.guide.${project}`;
const listeners = new Set<() => void>();

function read(project: string): GuideState {
  const flow = FLOWS[project] ?? [];
  try {
    const raw = window.localStorage.getItem(storageKey(project));
    if (raw === null) return flow[0] ?? "done"; // nothing stored yet = first visit
    return flow.includes(raw as GuideStep) ? (raw as GuideStep) : "done";
  } catch {
    return "done"; // no storage, so the progress could not be kept: do not nag on every visit
  }
}

function write(project: string, state: GuideState): void {
  try {
    window.localStorage.setItem(storageKey(project), state);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener); // the same lab open in another tab
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Where this visitor is in the guide of `project`; "done" on the server, so nothing flashes before hydration. */
function useGuideState(project: string): GuideState {
  return useSyncExternalStore(subscribe, () => read(project), () => "done");
}

const DESKTOP = "(min-width: 1024px)";

function subscribeDesktop(listener: () => void): () => void {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

/** Whether the tabs are on screen: always on large screens, on phones only while the bottom sheet is open. */
function usePanelVisible(): boolean {
  const open = useLabStore((s) => s.panelOpen);
  const desktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => false);
  return open || desktop;
}

function advance(project: string): void {
  const flow = FLOWS[project] ?? [];
  const current = read(project);
  write(project, flow[flow.indexOf(current as GuideStep) + 1] ?? "done");
}

/** The element's on-screen box, followed frame by frame (the bottom sheet slides in, the page scrolls). */
function useLiveRect(el: HTMLElement): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const r = el.getBoundingClientRect();
      setRect((p) => (p && p.x === r.x && p.y === r.y && p.width === r.width && p.height === r.height ? p : r));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [el]);
  return rect;
}

/**
 * Dims the whole page except the highlighted element (a huge box-shadow around a hole of the element's size), so the
 * tab stands out whatever stacking context it lives in. It never catches clicks: the page stays usable.
 */
function Spotlight({ anchor }: { anchor: HTMLElement }) {
  const rect = useLiveRect(anchor);
  if (!rect) return null;
  const pad = 4;
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-[55] rounded-xl shadow-[0_0_0_100vmax_rgb(0_0_0/0.5)] transition-opacity duration-200"
      style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
    />,
    document.body,
  );
}

function GuideTip({ project, step, anchor }: { project: string; step: GuideStep; anchor: HTMLElement }) {
  const flow = FLOWS[project] ?? [];
  const last = flow.indexOf(step) === flow.length - 1;
  return (
    <>
      <Spotlight anchor={anchor} />
      <PopoverPrimitive.Root open>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner anchor={anchor} side="bottom" align="start" sideOffset={12} collisionPadding={12} className="isolate z-[60]">
            <PopoverPrimitive.Popup
              initialFocus={false} // a hint must not steal the focus from what the visitor is doing
              className="flex w-60 max-w-[calc(100vw-1.5rem)] flex-col gap-2.5 rounded-lg bg-(--brand) p-3 text-sm text-white shadow-xl ring-1 ring-white/20 outline-hidden duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-2"
            >
              <PopoverPrimitive.Title className="font-semibold">{MESSAGES[step]}</PopoverPrimitive.Title>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/80">{flow.indexOf(step) + 1} of {flow.length}</span>
                <div className="flex items-center gap-1">
                  {!last && (
                    <Button size="xs" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => write(project, "done")}>
                      Skip
                    </Button>
                  )}
                  <Button size="xs" className="bg-white text-(--brand) hover:bg-white/90" onClick={() => advance(project)}>
                    {last ? "Got it" : "Next"}
                  </Button>
                </div>
              </div>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}

/** A panel tab; when it is the one the guide is on, it is highlighted and shows the tip. Clicking it moves the guide on. */
export function GuidedTabsTrigger({ project, guide, className, ...props }: {
  project: string;
  /** Which guide step this tab belongs to, none for tabs the guide does not mention. */
  guide?: GuideStep;
} & React.ComponentProps<typeof TabsTrigger>) {
  const state = useGuideState(project);
  const [el, setEl] = useState<HTMLElement | null>(null);
  const visible = usePanelVisible();
  const active = guide !== undefined && state === guide;

  return (
    <>
      <TabsTrigger
        {...props}
        ref={setEl}
        className={cn(className, active && "animate-pulse ring-2 ring-(--brand) ring-offset-1 ring-offset-background")}
        onClick={(e) => {
          props.onClick?.(e);
          if (active) advance(project);
        }}
      />
      {active && visible && el && <GuideTip project={project} step={guide} anchor={el} />}
    </>
  );
}
