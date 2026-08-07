"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type MonthlyBar = { label: string; value: number };

export function MonthlyChart({
  data,
  className,
  trackHeight = 176,
}: {
  data: MonthlyBar[];
  className?: string;
  trackHeight?: number;
}) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const maxPositive = Math.max(...data.map((d) => d.value), 0);

  return (
    <div
      className={cn("grid items-end gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 12)}, minmax(0, 1fr))` }}
    >
      {data.map((bar, i) => {
        const positive = bar.value >= 0;
        const share = Math.min(96, Math.round((Math.abs(bar.value) / max) * 100));
        const isMax = positive && bar.value === maxPositive && bar.value > 0;

        return (
          <div key={bar.label} className="flex min-w-0 flex-col items-center gap-1.5">
            <span className={cn("num text-[11px] font-bold", positive ? "text-pos" : "text-neg")}>
              {positive ? "+" : "−"}
              {Math.abs(bar.value) >= 1000
                ? `${(bar.value / 1000).toFixed(1)}k`
                : Math.round(Math.abs(bar.value))}
            </span>

            <div
              className="relative w-full overflow-hidden rounded-lg"
              style={{
                height: trackHeight,
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 4px, hsl(0 0% 0% / 0.04) 4px, hsl(0 0% 0% / 0.04) 8px)",
              }}
              role="presentation"
            >
              <motion.div
                className={cn(
                  "absolute left-0 right-0",
                  positive ? "bottom-0 rounded-t-md" : "top-0 rounded-b-md",
                  positive ? (isMax ? "bg-pos" : "bg-pos/45") : "bg-neg/45",
                )}
                initial={{ height: 0 }}
                animate={{ height: `${share}%` }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                aria-label={`${bar.label}: ${bar.value >= 0 ? "+" : ""}${bar.value}`}
                aria-valuenow={share}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <span className="text-[11px] font-semibold text-text-3">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}
