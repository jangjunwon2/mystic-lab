"use client";

interface Props {
  label: string;
  color: string; // hex e.g. "#10B981"
}

export default function StatusBadge({ label, color }: Props) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  );
}
