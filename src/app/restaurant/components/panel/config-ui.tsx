"use client";

/**
 * Presentation primitives for the Configuration tab only (cards, pills, fields, controls).
 * Other tabs keep using ./fields, so nothing outside the Configuration pane changes.
 */

import { Info } from "lucide-react";
import { Input } from "@/app/restaurant/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/restaurant/components/ui/select";
import { Slider } from "@/app/restaurant/components/ui/slider";
import { Switch } from "@/app/restaurant/components/ui/switch";
import { cn } from "@/app/restaurant/lib/utils";
import { InfoTip, type Option } from "./fields";

// ------------------------------------------------------------------------------------------ cards

export function Section({
  title,
  description,
  aside,
  tone = "white",
  children,
}: {
  title: string;
  description: string;
  /** Right-aligned element in the header (e.g. a status pill). */
  aside?: React.ReactNode;
  tone?: "white" | "slate";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-gray-200 p-5 shadow-xs sm:p-6",
        tone === "slate" ? "bg-slate-50" : "bg-white",
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------------------------------ pills

const PILL_TONES = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
} as const;

export function Pill({
  tone = "neutral",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof PILL_TONES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
        PILL_TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Explains why a group of controls is inactive for the chosen strategy. */
export function InactiveBanner({ strategy, labels }: { strategy: string; labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
      <Info className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
      <p>
        <span className="font-medium text-gray-700">Not applicable for {strategy}:</span> {labels.join(", ")}.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ fields

export function CField({
  label,
  htmlFor,
  tip,
  disabled,
  disabledReason = "Not applicable for the selected strategy",
  error,
  hint,
  span2,
  children,
}: {
  label: string;
  htmlFor?: string;
  tip?: string;
  disabled?: boolean;
  disabledReason?: string;
  error?: string;
  hint?: string;
  /** Occupy both columns of the 2-column grid. */
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", span2 && "col-span-2")}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            disabled ? "text-gray-400" : "text-gray-700",
          )}
        >
          {label}
          {tip && <InfoTip text={tip} />}
        </label>
        {disabled && (
          <span
            title={disabledReason}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-500 uppercase"
          >
            Not used
          </span>
        )}
      </div>
      {children}
      {hint && !disabled && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ controls

/** Shared look of every text-like control: same height, border, focus ring and disabled state. */
const CONTROL =
  "h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-xs transition-colors " +
  "hover:border-gray-400 focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/20 " +
  "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 " +
  "disabled:text-gray-400 disabled:opacity-100 disabled:shadow-none disabled:hover:border-gray-200";

export function SelectControl({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v)}
      items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn(CONTROL, "pr-2.5 data-[size=default]:h-9")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NumberControl({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  invalid,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      className={cn(CONTROL, "tabular-nums", invalid && "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20")}
      value={Number.isFinite(value) ? value : ""}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.valueAsNumber)}
    />
  );
}

/** Slider with its current value in a fixed-size box, in a row as tall as the other controls. */
export function SliderControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg border px-3",
        disabled ? "cursor-not-allowed border-gray-200 bg-gray-100" : "border-gray-300 bg-white shadow-xs",
      )}
    >
      <Slider
        value={[Number.isFinite(value) ? value : min]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
      <span
        className={cn(
          "w-8 shrink-0 text-right text-sm font-medium tabular-nums",
          disabled ? "text-gray-400" : "text-gray-900",
        )}
      >
        {Number.isFinite(value) ? value : "-"}
      </span>
    </div>
  );
}

export function SwitchControl({
  checked,
  onChange,
  disabled,
  label,
  onText = "On",
  offText = "Off",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  onText?: string;
  offText?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center justify-between rounded-lg border px-3 text-sm",
        disabled ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 bg-white text-gray-900 shadow-xs",
      )}
    >
      <span>{checked ? onText : offText}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

/** Read-only value displayed like a disabled control (e.g. the fixed separators). */
export function StaticControl({ disabled, children }: { disabled?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-1 overflow-hidden rounded-lg border px-2",
        disabled ? "cursor-not-allowed border-gray-200 bg-gray-100" : "border-gray-300 bg-gray-50",
      )}
    >
      {children}
    </div>
  );
}
