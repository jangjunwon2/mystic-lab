"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function AnalyticsExportButton() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!from || !to) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?from=${from}&to=${to}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mysticlab-orders-${from}-to-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#13131F",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "6px 10px",
    fontSize: "13px",
    colorScheme: "dark",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "#9CA3AF" }}>기간</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        <span className="text-xs" style={{ color: "#6B7280" }}>~</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
      </div>
      <button
        onClick={handleExport}
        disabled={loading || !from || !to}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "#7C3AED22", color: "#A855F7", border: "1px solid #7C3AED44" }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        CSV 내보내기
      </button>
    </div>
  );
}
