"use client";

import { useState } from "react";
import { useEquity, useTradeStats } from "@/hooks/use-trades";
import { useLang } from "@/lib/i18n";
import { cn, formatMoney, formatR } from "@/lib/utils";
import { ClippedAreaChart } from "@/components/ui/advanced-stats-utils/charts";
import { TimelineAnimation } from "@/components/ui/advanced-stats-utils/timeline-animation";

const RANGES = [
  { key: "7d", days: 7, label: "7D" },
  { key: "30d", days: 30, label: "30D" },
  { key: "90d", days: 90, label: "90D" },
  { key: "all", days: 9999, label: "all" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export function AdvancedStats({ className }: { className?: string }) {
  const { t } = useLang();
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const { data } = useEquity(days);
  const equity = data?.points ?? [];
  const count = data?.count ?? 0;

  const values = equity.map((p) => p.balance);
  const current = values.length ? values[values.length - 1] : 0;
  const isProfit = current >= 0;

  const chartData = equity.map((p) => ({
    label: p.date,
    value: Math.round(p.balance * 100) / 100,
  }));

  const tradeWord =
    count % 10 === 1 && count % 100 !== 11
      ? t("dashboard.equity.trade1")
      : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
        ? t("dashboard.equity.trade2_4")
        : t("dashboard.equity.trades");

  return (
    <TimelineAnimation className={cn("h-full", className)}>
      <div className="card flex h-[300px] flex-col overflow-hidden font-dm-sans lg:h-[420px]">
        <div className="p-6 pb-0">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-3">
              {t("dashboard.equity.t")}
            </span>
            <div className="flex items-center gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors",
                    range === r.key ? "bg-text-1 text-bg" : "text-text-3 hover:text-text-1",
                  )}
                >
                  {r.label === "all" ? t("dashboard.equity.all") : r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("num text-2xl font-black tracking-tighter", isProfit ? "text-text-1" : "text-neg")}>
              {formatMoney(current)}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] font-semibold text-text-3">
            {formatMoney(current)} · {t("dashboard.equity.period")} · {count} {tradeWord}
          </p>
        </div>
        <div className="min-h-0 flex-1 p-2">
          <ClippedAreaChart
            data={chartData}
            color="var(--color-text-1)"
            gradientId="eqGradAdvanced"
          />
        </div>
      </div>
    </TimelineAnimation>
  );
}

export function AdvancedKpiGrid({ className }: { className?: string }) {
  const { t } = useLang();
  const { data: stats } = useTradeStats();

  const cards = [
    {
      label: t("dashboard.kpi.pnl"),
      value: formatMoney(stats?.totalPnl ?? 0),
      sub: t("dashboard.kpi.allTime"),
      up: (stats?.totalPnl ?? 0) >= 0,
    },
    {
      label: t("dashboard.kpi.winrate"),
      value: `${(stats?.winRate ?? 0).toFixed(1)}%`,
      sub: `${stats?.wins ?? 0}W / ${stats?.losses ?? 0}L`,
      up: (stats?.winRate ?? 0) >= 50,
    },
    {
      label: t("dashboard.kpi.profitFactor"),
      value:
        stats && stats.losses === 0 && stats.wins > 0
          ? `${stats.wins}W / 0L`
          : (stats?.profitFactor ?? 0).toFixed(2),
      sub: `${stats?.count ?? 0} ${t("dashboard.kpi.winrateSub")}`,
      up: (stats?.profitFactor ?? 0) >= 1,
    },
    {
      label: t("dashboard.kpi.avgR"),
      value: formatR(stats?.avgR ?? 0),
      sub: t("dashboard.kpi.multiplier"),
      up: (stats?.avgR ?? 0) >= 0,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-4 font-dm-sans lg:grid-cols-4", className)}>
      {cards.map((k) => (
        <div
          key={k.label}
          className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:bg-bg hover:shadow-[var(--shadow-card-hover)]"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-3">
            {k.label}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xl font-black tracking-tighter text-text-1">{k.value}</p>
            <span className="shrink-0 rounded bg-bg px-1.5 py-0.5 text-[11px] font-bold text-text-2">
              {k.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
