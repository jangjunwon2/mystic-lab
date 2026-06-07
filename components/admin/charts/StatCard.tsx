"use client";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "#1A1A2E",
        borderColor: highlight ? "#A855F7" : "#2D2D4E",
      }}
    >
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: highlight ? "#A855F7" : "#F0E6FF" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
