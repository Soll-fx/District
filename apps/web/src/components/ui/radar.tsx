export type RadarAxis = {
  key: string;
  label: string;
  value: number;
};

export function Radar({
  axes,
  size = 260,
  color = "#7C6CF0",
}: {
  axes: RadarAxis[];
  size?: number;
  color?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 26;
  const n = axes.length;

  const point = (i: number, factor: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius * factor,
      y: cy + Math.sin(angle) * radius * factor,
    };
  };

  const levels = [0.25, 0.5, 0.75, 1];
  const shape = axes.map((a, i) => point(i, a.value / 100));
  const shapePts = shape.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {levels.map((lv) => {
        const pts = axes.map((_, i) => point(i, lv));
        return (
          <polygon
            key={lv}
            points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth={1}
          />
        );
      })}
      {axes.map((_, i) => {
        const p = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--card-border)" strokeWidth={1} />;
      })}

      <polygon points={shapePts} fill={color} opacity={0.22} stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {axes.map((a, i) => {
        const p = point(i, a.value / 100);
        return <circle key={a.key} cx={p.x} cy={p.y} r={3} fill={color} />;
      })}

      {axes.map((a, i) => {
        const p = point(i, 1.18);
        return (
          <text
            key={a.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10.5}
            fontWeight={700}
            fill="#6B7280"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
