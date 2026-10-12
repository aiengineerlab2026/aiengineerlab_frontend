"use client";

import { Info } from "lucide-react";
import { Input } from "@/app/restaurant/components/ui/input";
import { Label } from "@/app/restaurant/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/restaurant/components/ui/select";
import { Slider } from "@/app/restaurant/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/restaurant/components/ui/tooltip";
import { cn } from "@/app/restaurant/lib/utils";

export function InfoTip({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" aria-label="More information" />}
        className={cn("text-muted-foreground hover:text-foreground", className)}
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{text}</TooltipContent>
    </Tooltip>
  );
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  tip?: string;
  /** When true the control is greyed out and `disabledReason` explains why. */
  disabled?: boolean;
  disabledReason?: string;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, tip, disabled, disabledReason, error, right, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", disabled && "opacity-55")}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium">
          {label}
          {tip && <InfoTip text={tip} />}
        </Label>
        {right}
      </div>
      {children}
      {disabled && disabledReason && <p className="text-[11px] text-muted-foreground">{disabledReason}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export function OptionSelect({
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
      <SelectTrigger id={id} className="h-9 w-full">
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

export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      className="h-9"
      value={Number.isFinite(value) ? value : ""}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => onChange(e.target.valueAsNumber)}
    />
  );
}

export function SliderInput({
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
    <div className="flex items-center gap-3">
      <Slider
        value={[Number.isFinite(value) ? value : min]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
      <span className="w-8 text-right text-sm tabular-nums">{Number.isFinite(value) ? value : "-"}</span>
    </div>
  );
}
