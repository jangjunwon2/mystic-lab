"use client";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const W = 640;
  const H = 160;
  const pad = { top: 12, right: 8, bottom: 24, left: 48 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const barW = Math.max(1, chartW / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "200px" }}>
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((frac) => {
        const y = pad.top + chartH * (1 - frac);
        const val = maxRev * frac;
        return (
          <g key={frac}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#2D2D4E" strokeWidth={1} />
            <text x={pad.left - 4} y={y + 4} fill="#6B7280" fontSize={9} textAnchor="end">
              ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.left + i * (chartW / data.length) + 1;
        const barH = (d.revenue / maxRev) * chartH;
        const y = pad.top + chartH - barH;
        const isWeekend = new Date(d.date).getDay() % 6 === 0;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={d.revenue > 0 ? (isWeekend ? "#A855F7" : "#7C3AED") : "#1A1A2E"}
            />
            {/* X label — show only every 5 days */}
            {i % 5 === 0 && (
              <text
                x={x + barW / 2}
                y={H - 4}
                fill="#6B7280"
                fontSize={8}
                textAnchor="middle"
              >
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
