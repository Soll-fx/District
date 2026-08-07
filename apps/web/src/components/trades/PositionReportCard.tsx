"use client";

import { useMemo } from "react";
import {
  AreaChart,
  AreaSeries,
  GridlineSeries,
  LinearXAxis,
  LinearXAxisTickLabel,
  LinearXAxisTickSeries,
  LinearYAxis,
  LinearYAxisTickLabel,
  LinearYAxisTickSeries,
} from "reaviz";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn, formatMoney, formatR } from "@/lib/utils";
import type { TradeView } from "@/lib/mappers";

const COLORS = {
  equity: "#7C6CF0",
  longs: "#22C55E",
  shorts: "#EF4444",
} as const;

function compactMoney(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function PositionReportCard({ trade, trades }: { trade: TradeView; trades: TradeView[] }) {
  const { t, lang } = useLang();
  const win = trade.pnl >= 0;

  const data = useMemo(() => {
    const sorted = [...trades].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime(),
    );
    const at = sorted.findIndex((tr) => tr.id === trade.id);
    const upto = at === -1 ? sorted : sorted.slice(0, at + 1);

    const equity: { key: Date; data: number }[] = [];
    const longs: { key: Date; data: number }[] = [];
    const shorts: { key: Date; data: number }[] = [];
    let e = 0;
    let l = 0;
    let s = 0;
    for (const tr of upto) {
      const date = new Date(tr.entryDate);
      e += tr.pnl;
      l += tr.direction === "long" ? tr.pnl : 0;
      s += tr.direction === "short" ? tr.pnl : 0;
      equity.push({ key: date, data: e });
      longs.push({ key: date, data: l });
      shorts.push({ key: date, data: s });
    }
    return [
      { key: t("trades.chart.equity"), data: equity },
      { key: t("trades.chart.longs"), data: longs },
      { key: t("trades.chart.shorts"), data: shorts },
    ];
  }, [trades, trade, t]);

  const lastPoint = data[0].data[data[0].data.length - 1];
  const finalEquity = typeof lastPoint?.data === "number" ? lastPoint.data : 0;

  const fmtDate = (v: unknown) => {
    const d = new Date(v as Date);
    if (Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
    })
      .format(d)
      .replace(".", "");
  };

  const legend = [
    { name: t("trades.chart.equity"), color: COLORS.equity },
    { name: t("trades.chart.longs"), color: COLORS.longs },
    { name: t("trades.chart.shorts"), color: COLORS.shorts },
  ];

  return (
    <div className="card overflow-hidden font-dm-sans">
      <div className="flex items-start justify-between gap-3 p-5 pb-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-[17px] font-extrabold tracking-tight text-text-1">{trade.asset}</span>
            <span
              className={cn(
                "pill !px-2 !py-0.5 text-[10px]",
                trade.direction === "long" ? "pill-pos" : "pill-neg",
              )}
            >
              {trade.direction === "long" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {trade.direction === "long" ? "Long" : "Short"}
            </span>
            <span className={cn("pill !px-2 !py-0.5 text-[10px]", win ? "pill-pos" : "pill-neg")}>
              {win ? t("trades.detail.win") : t("trades.detail.loss")}
            </span>
          </div>
          <p className="mt-1.5 truncate text-[11.5px] font-semibold text-text-3">
            {t("trades.chart.equity")} · {formatMoney(finalEquity)}
          </p>
        </div>
        <span
          className={cn(
            "num flex shrink-0 items-center gap-1 text-[17px] font-extrabold tracking-tight",
            win ? "text-pos" : "text-neg",
          )}
        >
          {win ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownRight size={16} strokeWidth={2.5} />}
          {formatMoney(trade.pnl)}
        </span>
      </div>

      <div className="mt-3 h-[170px] w-full px-2">
        <AreaChart
          data={data}
          height={170}
          series={
            <AreaSeries
              type="grouped"
              colorScheme={[COLORS.equity, COLORS.longs, COLORS.shorts]}
              interpolation="smooth"
            />
          }
          xAxis={
            <LinearXAxis
              type="time"
              tickSeries={<LinearXAxisTickSeries label={<LinearXAxisTickLabel format={fmtDate} />} />}
            />
          }
          yAxis={
            <LinearYAxis
              type="value"
              tickSeries={<LinearYAxisTickSeries label={<LinearYAxisTickLabel format={(v) => compactMoney(Number(v))} />} />}
            />
          }
          gridlines={<GridlineSeries />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pb-4 pt-1">
        {legend.map((lg) => (
          <span key={lg.name} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-3">
            <span className="h-2 w-2 rounded-full" style={{ background: lg.color }} />
            {lg.name}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-card-border p-5 pt-4">
        <div>
          <p className="label-caps mb-1">{t("trades.detail.pnl")}</p>
          <p className={cn("num text-[15px] font-extrabold", win ? "text-pos" : "text-neg")}>
            {formatMoney(trade.pnl)}
          </p>
        </div>
        <div>
          <p className="label-caps mb-1">{t("trades.detail.rMultiple")}</p>
          <p className={cn("num text-[15px] font-extrabold", trade.r >= 0 ? "text-pos" : "text-neg")}>
            {formatR(trade.r)}
          </p>
        </div>
        <div>
          <p className="label-caps mb-1">{t("trades.detail.riskReward")}</p>
          <p className="num text-[15px] font-extrabold text-text-1">
            {trade.r >= 0 ? `1 : ${trade.r.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
