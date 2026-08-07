"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge, Activity, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Radar } from "@/components/ui/radar";
import { Ring } from "@/components/ui/ring";
import { MonthlyChart } from "@/components/ui/monthly-chart";
import { cn, formatMoney } from "@/lib/utils";
import { useAnalyticsSummary, useEquity, useTradeStats } from "@/hooks/use-trades";
import { useLang } from "@/lib/i18n";

const PERIODS = ["7D", "30D", "90D", "All"] as const;
type Period = (typeof PERIODS)[number];

const DAYS: Record<Period, number> = { "7D": 7, "30D": 30, "90D": 90, All: 9999 };

const SESSION_COLOR: Record<string, string> = {
  LONDON: "#22C55E",
  NEW_YORK: "#14B8A6",
  ASIA: "#7C6CF0",
};

const MONTH_LABEL = new Intl.DateTimeFormat("ru-RU", { month: "short" });

function shortLabel(iso: string) {
  return MONTH_LABEL.format(new Date(iso)).replace(".", "");
}

function dayLabel(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" })
    .format(new Date(iso))
    .replace(".", "");
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30D");
  const { t } = useLang();

  const { data: summary } = useAnalyticsSummary();
  const { data: stats } = useTradeStats();
  const { data: equityRes } = useEquity(365);
  const equity = equityRes?.points ?? [];
  const [now] = useState(() => Date.now());

  const axes = summary?.axes ?? [];
  const overall = summary?.overall ?? 0;
  const grade = summary?.grade ?? "—";
  const winRate = summary?.winRate ?? 0;

  const equityData = useMemo(() => {
    if (!equity?.length) return [];
    const since = now - DAYS[period] * 24 * 60 * 60 * 1000;
    const idx = equity.findIndex((p) => new Date(p.date).getTime() >= since);
    const anchor = idx > 0 ? [equity[idx - 1]] : [];
    const points = idx < 0 ? [] : equity.slice(idx);
    return anchor.concat(points).map((p) => ({
      d: period === "7D" || period === "30D" ? dayLabel(p.date) : shortLabel(p.date),
      v: p.balance,
    }));
  }, [equity, period, now]);

  const equityPeak = equityData.length ? Math.max(...equityData.map((p) => p.v)) : 0;
  const equityLast = equityData.length ? equityData[equityData.length - 1].v : 0;
  const equityDrawdown = equityPeak - equityLast;

  const sessions = useMemo(() => {
    if (!stats?.sessions) return [];
    const total = stats.totalPnl;
    return Object.entries(stats.sessions)
      .map(([key, row]) => ({
        s: t(`trades.session.${key}`),
        pnl: row.pnl,
        share: total > 0 ? Math.max(2, Math.round((row.pnl / total) * 100)) : 0,
        c: SESSION_COLOR[key] ?? "#14B8A6",
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [stats, t]);

  const monthly = useMemo(() => {
    if (!stats?.byMonth) return [];
    return Object.entries(stats.byMonth)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, row]) => ({ label: shortLabel(`${key}-01T00:00:00`), value: row.pnl }));
  }, [stats]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.analytics.t")}
        subtitle={t("page.analytics.s")}
        actions={
          <div className="pill-control">
            {PERIODS.map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)} className={cn(period === p && "active")}>
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Radar + P/L ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="hero-card animate-in p-6 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge size={17} className="text-white/70" />
              <h2 className="text-[15px] font-extrabold tracking-tight text-white">{t("analytics.pulse")}</h2>
            </div>
            <div className="text-right">
              <p className="num text-[30px] font-extrabold leading-none text-white">{overall}/100</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
                {t("analytics.grade")} {grade}
              </p>
            </div>
          </div>
          <Radar axes={axes} color="#14B8A6" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {axes.map((a) => (
              <div key={a.key} className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2">
                <span className="text-[11px] font-semibold text-white/60">{a.label}</span>
                <span className="num text-[12px] font-bold text-white">{a.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in animate-delay-1 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-text-2" />
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("analytics.pnlTitle")}</h2>
          </div>

          <div className="flex items-center gap-4">
            <Ring value={winRate} size={92} stroke={8} color="#22C55E">
              <div>
                <p className="num text-[19px] font-extrabold leading-none text-text-1">{winRate.toFixed(1)}%</p>
                <p className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide text-text-3">{t("analytics.winrate")}</p>
              </div>
            </Ring>
            <div className="flex-1 space-y-2">
              {[
                { k: "analytics.avgWin", v: formatMoney(summary?.avgWin ?? 0), c: "text-pos" },
                { k: "analytics.avgLoss", v: formatMoney(summary?.avgLoss ?? 0), c: "text-neg" },
                { k: "analytics.maxWin", v: formatMoney(summary?.maxWin ?? 0), c: "text-pos" },
                { k: "analytics.maxLoss", v: formatMoney(summary?.maxLoss ?? 0), c: "text-neg" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-text-2">{t(r.k)}</span>
                  <span className={cn("num font-bold", r.c)}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-card-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-text-2">{t("dashboard.kpi.profitFactor")}</span>
              <span className="num text-[16px] font-extrabold text-pos">
                {(summary?.profitFactor ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-text-3">
              {summary?.maxDrawdown
                ? `${t("analytics.maxDrawdown")} ${formatMoney(-summary.maxDrawdown)}`
                : t("analytics.noDrawdown")}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Equity curve ── */}
      <Card className="animate-in animate-delay-2 p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("analytics.equity")}</h2>
            <p className="mt-0.5 text-[12px] text-text-2">
              {t("analytics.peak")} <span className="num font-bold text-pos">{formatMoney(equityPeak)}</span> ·{" "}
              {t("analytics.drawdown")}{" "}
              <span className="num font-bold text-neg">{formatMoney(-equityDrawdown)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="pill pill-teal">
              <CalendarRange size={12} /> {period === "All" ? t("analytics.allTime") : `${t("analytics.lastPeriod")} ${period}`}
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 12, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-text-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--color-text-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--card-border)" vertical={false} />
              <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9AA1B0", fontWeight: 600 }} dy={6} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#9AA1B0", fontWeight: 600 }}
                width={54}
                tickFormatter={(v: number) => `$${v / 1000}k`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v ?? 0).toLocaleString("en-US")}`, t("analytics.equityName")]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 2px 10px rgba(20,25,40,.05)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--color-text-1)"
                strokeWidth={2.2}
                fill="url(#equityFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-text-1)", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Сессии + месяцы ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="animate-in animate-delay-3 p-5">
          <h2 className="mb-4 text-[15px] font-extrabold tracking-tight text-text-1">{t("analytics.bySession")}</h2>
          <div className="space-y-4">
            {sessions.map((row) => (
              <div key={row.s}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-text-1">{row.s}</span>
                  <span className="num font-bold text-pos">{formatMoney(row.pnl)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral/6">
                  <div className="h-full rounded-full" style={{ width: `${row.share}%`, background: row.c }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in animate-delay-4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("analytics.byMonth")}</h2>
            <span className="pill pill-teal">
              <CalendarRange size={12} /> {t("analytics.monthly")}
            </span>
          </div>
          <MonthlyChart data={monthly} />
          {!monthly.length && (
            <p className="py-16 text-center text-[13px] text-text-3">{t("analytics.noData")}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
