"use client";

import { useMemo, useState } from "react";
import {
  ProgressMetricCard,
  type PeriodOption,
  type SeriesPoint,
} from "@/components/ui/progress-metric-card";
import { useEquity } from "@/hooks/use-trades";
import { useLang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

const RANGES = [
  { key: "7d", days: 7, label: "7D" },
  { key: "30d", days: 30, label: "30D" },
  { key: "90d", days: 90, label: "90D" },
  { key: "all", days: 9999, label: undefined },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function compactMoney(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function shortDate(iso: string, lang: "ru" | "en") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  })
    .format(d)
    .replace(".", "");
}

export function DashboardEquityCard({ className }: { className?: string }) {
  const { t, lang } = useLang();
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const { data, isLoading } = useEquity(days);

  const periods = useMemo<PeriodOption[]>(
    () =>
      RANGES.map((r) => ({
        label: r.label ?? t("dashboard.equity.all"),
      })),
    [t],
  );

  const points = useMemo<SeriesPoint[]>(() => {
    const raw = (data?.points ?? []).map((p) => ({ date: p.date, value: p.balance }));
    if (
      raw.length > 1 &&
      raw[0].value === 0 &&
      new Date(raw[1].date).getTime() > new Date(raw[0].date).getTime()
    ) {
      raw.shift();
    }
    if (raw.length && raw[0].value !== 0) {
      raw.unshift({ date: raw[0].date, value: 0 });
    }
    return raw;
  }, [data]);

  const last = points[points.length - 1]?.value ?? 0;
  const base = points[0]?.value ?? 0;
  const net = last;
  const pct = base !== 0 ? (net / Math.abs(base)) * 100 : 0;
  const trend: "up" | "down" | undefined = net > 0 ? "up" : net < 0 ? "down" : undefined;

  const handlePeriodChange = (opt: PeriodOption) => {
    const r = RANGES.find((x) => (x.label ?? t("dashboard.equity.all")) === opt.label);
    if (r) setRange(r.key);
  };

  return (
    <ProgressMetricCard
      title={t("dashboard.equity.t")}
      data={points}
      total={compactMoney(last)}
      delta={formatMoney(net)}
      deltaLabel={t("dashboard.equity.period")}
      percent={`${Math.abs(pct).toFixed(1)}%`}
      trend={trend}
      period="30D"
      periodOptions={periods}
      onPeriodChange={handlePeriodChange}
      defaultView="curve"
      size="md"
      loading={isLoading}
      valueFormatter={compactMoney}
      dateFormatter={(d) => shortDate(d, lang)}
      className={className}
    />
  );
}
