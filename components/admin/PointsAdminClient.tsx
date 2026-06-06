"use client";

import { useState } from "react";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  point_earn_rate: number | null;
}

interface Props {
  initialRate: number;
  products: ProductRow[];
}

const card: React.CSSProperties = { background: "#1A1A2E", borderColor: "#2D2D4E" };
const inp: React.CSSProperties = {
  background: "#13131F", border: "1px solid #2D2D4E",
  borderRadius: "8px", color: "#F0E6FF", padding: "6px 10px", fontSize: "13px",
};
const saveBtn: React.CSSProperties = { background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" };

function GlobalRateCard({ initialRate }: { initialRate: number }) {
  const [percent, setPercent] = useState(String(Math.round(initialRate * 1000) / 10));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    const pct = parseFloat(percent);
    if (isNaN(pct) || pct < 0 || pct > 100) { setMsg("❌ 0~100% 사이여야 합니다."); return; }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointEarnRate: pct / 100 }),
    });
    setSaving(false);
    setMsg(res.ok ? "✅ 저장됨." : "❌ 저장 실패.");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <div className="rounded-xl border p-6" style={card}>
      <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>기본 적립률</h2>
      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
        전 상품 공통 적립 비율. 상품별 개별 설정이 없으면 이 값을 사용합니다. (100P = $1)
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number" min={0} max={100} step={0.1}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="w-28 rounded-lg text-sm outline-none focus:border-purple-500"
          style={{ ...inp, color: "#F59E0B" }}
        />
        <span className="text-sm" style={{ color: "#9CA3AF" }}>%</span>
        <button
          onClick={save} disabled={saving}
          className="ml-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={saveBtn}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      {msg && <p className="text-sm mt-2" style={{ color: msg.startsWith("✅") ? "#10B981" : "#EF4444" }}>{msg}</p>}
    </div>
  );
}

function ProductRateRow({ product, globalRate }: { product: ProductRow; globalRate: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    product.point_earn_rate !== null ? String(Math.round(product.point_earn_rate * 1000) / 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(product.point_earn_rate);

  const globalPct = Math.round(globalRate * 1000) / 10;

  async function save() {
    const raw = value.trim();
    const newRate = raw === "" ? null : parseFloat(raw) / 100;
    if (newRate !== null && (isNaN(newRate) || newRate < 0 || newRate > 1)) return;
    setSaving(true);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ point_earn_rate: newRate }),
    });
    setSaving(false);
    if (res.ok) { setCurrent(newRate); setEditing(false); }
  }

  const displayRate = current !== null
    ? `${Math.round(current * 1000) / 10}%`
    : `기본 (${globalPct}%)`;

  return (
    <tr className="border-b last:border-0" style={{ borderColor: "#2D2D4E" }}>
      <td className="px-4 py-3 text-sm" style={{ color: "#F0E6FF" }}>{product.name}</td>
      <td className="px-4 py-3 text-xs font-mono" style={{ color: "#6B7280" }}>{product.slug}</td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={100} step={0.1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`기본 (${globalPct}%)`}
              className="w-28 rounded text-xs outline-none"
              style={{ ...inp, padding: "4px 8px" }}
              autoFocus
            />
            <span className="text-xs" style={{ color: "#9CA3AF" }}>% (비우면 기본)</span>
            <button
              onClick={save} disabled={saving}
              className="px-3 py-1 rounded text-xs font-medium hover:opacity-80 disabled:opacity-50"
              style={{ background: "#7C3AED", color: "#fff" }}
            >
              {saving ? "…" : "저장"}
            </button>
            <button
              onClick={() => { setValue(current !== null ? String(Math.round(current * 1000) / 10) : ""); setEditing(false); }}
              className="px-3 py-1 rounded text-xs hover:opacity-80"
              style={{ background: "#2D2D4E", color: "#9CA3AF" }}
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="text-sm tabular-nums"
              style={{ color: current !== null ? "#A855F7" : "#6B7280" }}
            >
              {displayRate}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: "#2D2D4E", color: "#9CA3AF" }}
            >
              변경
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function PointsAdminClient({ initialRate, products }: Props) {
  return (
    <div className="space-y-8">
      <GlobalRateCard initialRate={initialRate} />

      <div className="rounded-xl border overflow-hidden" style={card}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#2D2D4E" }}>
          <h2 className="text-base font-semibold" style={{ color: "#F0E6FF" }}>상품별 적립률</h2>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            개별 설정 시 해당 상품에만 적용됩니다. 비워두면 기본 적립률을 사용합니다.
          </p>
        </div>
        {products.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "#6B7280" }}>등록된 상품이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                  {["상품명", "슬러그", "적립률"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider" style={{ color: "#6B7280" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <ProductRateRow key={p.id} product={p} globalRate={initialRate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
