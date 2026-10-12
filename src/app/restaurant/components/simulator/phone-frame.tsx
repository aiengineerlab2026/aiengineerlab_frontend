import { cn } from "@/app/restaurant/lib/utils";

/** A phone-shaped container. Children render inside the screen; overlays should be `absolute inset-0`. */
export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[390px] rounded-[2.75rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl",
        "h-[min(800px,calc(100dvh-7rem))] min-h-[600px]",
        className,
      )}
    >
      <div className="absolute top-0 left-1/2 z-30 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" aria-hidden />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white">{children}</div>
    </div>
  );
}
