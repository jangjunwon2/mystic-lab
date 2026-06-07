"use client";

interface VisitorChartProps {
  data: { date: string; [k: string]: number | string }[];
  dataKey: string;
  label: string;
  color: string;
}

export default function VisitorChart({ data, dataKey, label, color }: VisitorChartProps) {
  const W = 640; const H = 140;
  const pad = { top: 10, right: 8, bottom: 24, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = Math.max(...data.map((d) => d[dataKey] as number), 1);
  const barW = Math.max(1, chartW / data.length - 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "160px" }}>
      {[0, 0.5, 1].map((frac) => {
        const y = pad.top + chartH * (1 - frac);
        return (
          <g key={frac}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#2D2D4E" strokeWidth={1} />
            <text x={pad.left - 4} y={y + 4} fill="#6B7280" fontSize={9} textAnchor="end">{Math.round(maxV * frac)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const v = d[dataKey] as number;
        const x = pad.left + i * (chartW / data.length) + 1;
        const barH = (v / maxV) * chartH;
        const y = pad.top + chartH - barH;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={barH} rx={2} fill={v > 0 ? color : "#1A1A2E"} />
            {i % 5 === 0 && <text x={x + barW / 2} y={H - 4} fill="#6B7280" fontSize={8} textAnchor="middle">{String(d.date).slice(5)}</text>}
          </g>
        );
      })}
      <text x={pad.left} y={pad.top - 1} fill="#9CA3AF" fontSize={9}>{label}</text>
    </svg>
  );
}
