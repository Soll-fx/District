"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ClippedAreaChartProps = {
  data: { label: string; value: number }[];
  color?: string;
  gradientId?: string;
};

export function ClippedAreaChart({
  data,
  color = "#22C55E",
  gradientId = "eqGrad",
}: ClippedAreaChartProps) {
  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="60%" stopColor={color} stopOpacity={0.08} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
        <Tooltip
          cursor={{ stroke: color, strokeOpacity: 0.25 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-card-border bg-card px-3 py-2 text-xs shadow-lg">
                <span className="num font-bold text-text-1">
                  ${Number(payload[0].value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
