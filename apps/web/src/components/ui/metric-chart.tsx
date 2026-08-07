"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export type ChartView = "curve" | "bars";
export type MetricAccent = "emerald" | "rose" | "amber" | "violet" | "sky" | "neutral";

export type SeriesPoint = { date: string; value: number };
export type MetricSeries = { name: string; data: SeriesPoint[]; accent?: MetricAccent };
export type ChartSeries = { name: string; data: SeriesPoint[]; color: string };

export const ACCENTS: Record<MetricAccent, { stroke: string; text: string }> = {
  emerald: { stroke: "#22C55E", text: "#16A34A" },
  rose: { stroke: "#EF4444", text: "#DC2626" },
  amber: { stroke: "#F59E0B", text: "#D97706" },
  violet: { stroke: "#7C6CF0", text: "#6D5CE0" },
  sky: { stroke: "#0EA5E9", text: "#0284C7" },
  neutral: { stroke: "#9AA1B0", text: "#6B7280" },
};

export const SERIES_COLORS = ["#7C6CF0", "#22C55E", "#EF4444", "#F59E0B", "#0EA5E9"];

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n)}`;
}

const PAD = { top: 12, right: 26, bottom: 16, left: 8 };
const TOOLTIP_W = 150;
const ROW_H = 15;
const HEAD_H = 20;
const PAD_Y = 9;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function truncateName(name: string, max: number) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function MetricChart({
  series,
  view,
  valueFormatter,
  dateFormatter,
}: {
  series: ChartSeries[];
  view: ChartView;
  valueFormatter: (value: number) => string;
  dateFormatter: (date: string) => string;
}) {
  const { ref, size } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const primary = series[0];
  const len = primary?.data.length ?? 0;
  const focus = hover;

  const domain = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const s of series) {
      for (const d of s.data) {
        min = Math.min(min, d.value);
        max = Math.max(max, d.value);
      }
    }
    const slack = (max - min) * 0.15 || Math.max(Math.abs(max) * 0.1, 1);
    return { min: min - slack, max: max + slack };
  }, [series]);

  const { width: W, height: H } = size;
  if (W < 10 || H < 10 || len === 0) return <div ref={ref} className="h-full w-full" />;

  const range = domain.max - domain.min || 1;
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const xAt = (i: number) => PAD.left + (len <= 1 ? iw / 2 : (i / (len - 1)) * iw);
  const yAt = (v: number) => PAD.top + (1 - (v - domain.min) / range) * ih;
  const yBase = yAt(0);
  const focusX = focus != null ? xAt(focus) : PAD.left;
  const pointY = yAt(focus != null ? primary.data[focus]?.value ?? 0 : 0);

  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = Math.round(((x - PAD.left) / iw) * (len - 1));
    setHover(Math.max(0, Math.min(i, len - 1)));
  };

  const barSlot = iw / len;
  const barW = Math.min(barSlot * 0.5, 18) / Math.max(series.length, 1);
  const gap = 2;
  const totalBarW = barW * series.length + gap * Math.max(series.length - 1, 0);
  const barX = (i: number, k: number) => xAt(i) - totalBarW / 2 + k * (barW + gap);

  const tooltipH = HEAD_H + series.length * ROW_H + PAD_Y;
  const above = pointY > H * 0.55;
  const tX = Math.max(4, Math.min(focusX - TOOLTIP_W / 2, W - TOOLTIP_W - 4));
  const tY = above ? pointY - tooltipH - 10 : pointY + 12;

  return (
    <div ref={ref} className="h-full w-full">
      <svg className="h-full w-full" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {view === "curve"
          ? series.map((s) => {
              const pts = s.data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }));
              const line = smoothPath(pts);
              const area =
                line && pts.length > 1
                  ? `${line} L${pts[pts.length - 1].x.toFixed(1)},${yBase.toFixed(1)} L${pts[0].x.toFixed(1)},${yBase.toFixed(1)} Z`
                  : "";
              return (
                <g key={s.name}>
                  {area && <path d={area} fill={s.color} opacity={0.12} stroke="none" />}
                  {line && (
                    <path
                      d={line}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                  )}
                </g>
              );
            })
          : series.map((s, k) => (
              <g key={s.name}>
                {s.data.map((d, i) => {
                  const y = yAt(d.value);
                  return (
                    <rect
                      key={i}
                      x={barX(i, k)}
                      y={Math.min(y, yBase)}
                      width={barW}
                      height={Math.max(Math.abs(y - yBase), 1)}
                      rx={2}
                      fill={s.color}
                      opacity={0.85}
                    />
                  );
                })}
              </g>
            ))}

        {focus != null && focus >= 0 && (
          <g>
            <line x1={focusX} x2={focusX} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(128,138,160,0.35)" strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.name} cx={focusX} cy={yAt(s.data[focus]?.value ?? 0)} r={3.5} fill={s.color} stroke="#FFFFFF" strokeWidth={1.5} />
            ))}
          </g>
        )}

        {focus != null && focus >= 0 && (
          <g transform={`translate(${tX},${tY})`}>
            <rect width={TOOLTIP_W} height={tooltipH} rx={10} fill="rgba(18,24,43,0.96)" />
            <text x={TOOLTIP_W / 2} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill="#EDEFF4">
              {dateFormatter(primary.data[focus].date)}
            </text>
            {series.map((s, i) => {
              const val = s.data[focus]?.value ?? 0;
              return (
                <g key={s.name}>
                  <circle cx={10} cy={HEAD_H + i * ROW_H + PAD_Y / 2} r={2.5} fill={s.color} />
                  <text x={18} y={HEAD_H + i * ROW_H + PAD_Y / 2 + 3.5} fontSize={10} fill="#A6ADBB">
                    {truncateName(s.name, 13)}
                  </text>
                  <text x={TOOLTIP_W - 10} y={HEAD_H + i * ROW_H + PAD_Y / 2 + 3.5} textAnchor="end" fontSize={10} fontWeight={600} fill="#EDEFF4">
                    {valueFormatter(val)}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
