"use client";

import { BarChart3, ChevronDown, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartView } from "./metric-chart";

export type PeriodOption = { label: string; points?: number };

export function ViewToggle({ value, onChange }: { value: ChartView; onChange: (view: ChartView) => void }) {
  const options: { view: ChartView; Icon: typeof LineChart }[] = [
    { view: "curve", Icon: LineChart },
    { view: "bars", Icon: BarChart3 },
  ];
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg bg-bg p-0.5">
      {options.map(({ view: v, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-text-3 transition-colors hover:text-text-1",
            value === v && "bg-card text-text-1 shadow-sm",
          )}
          aria-pressed={value === v}
          aria-label={v}
        >
          <Icon size={13} strokeWidth={2.5} />
        </button>
      ))}
    </div>
  );
}

export function PeriodSelect({
  value,
  options,
  onChange,
  accentText,
}: {
  value: string;
  options: PeriodOption[];
  onChange: (option: PeriodOption) => void;
  accentText: string;
}) {
  return (
    <div className="pointer-events-auto relative">
      <select
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => o.label === e.target.value);
          if (opt) onChange(opt);
        }}
        className="cursor-pointer appearance-none rounded-lg border border-card-border bg-transparent py-1 pl-2.5 pr-7 text-[12.5px] font-medium outline-none transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-ring/40"
        style={{ color: accentText }}
      >
        {options.map((o) => (
          <option key={o.label} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-3" />
    </div>
  );
}
