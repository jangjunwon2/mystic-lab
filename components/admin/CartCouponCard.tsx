"use client";

import { useState } from "react";

export interface CartCoupon {
  enabled: boolean;
  days: number;
  percent: number;
  months: number;
  name: string;
}

const cardStyle = { background: "#1A1A2E", borderColor: "#2D2D4E" } as const;
const inputStyle = { background: "#13131F", borderColor: "#2D2D4E", color: "#F59E0B" } as const;
const saveBtnStyle = { background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" } as const;
const inputCls = "px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500";

// 장바구니 잔존 트리거 쿠폰 — N일 이상 장바구니를 방문하지 않은 회원에게 그 상품 한정 쿠폰 자동발급.
export default function CartCouponCard({ initial }: { initial: CartCoupon }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [days, setDays] = useState(String(initial.days));
  const [percent, setPercent] = useState(String(initial.percent));
  const [months, setMonths] = useState(String(initial.months));
  const [name, setName] = useState(initial.name);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    const d = parseInt(days, 10), p = parseFloat(percent), m = parseInt(months, 10);
    if (isNaN(d) || d <= 0 || d > 365) { setErr("잔존 일수는 1~365 사이여야 합니다."); return; }
    if (isNaN(p) || p <= 0 || p > 100) { setErr("할인율은 0~100% 사이여야 합니다."); return; }
    if (isNaN(m) || m <= 0 || m > 60) { setErr("유효기간은 1~60개월 사이여야 합니다."); return; }
    setSaving(true); setErr(""); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartCoupon: { enabled, days: d, percent: p, months: m, name: name.trim() } }),
    });
    setSaving(false);
    if (res.ok) { setMsg("저장되었습니다."); setTimeout(() => setMsg(""), 2500); }
    else { const j = await res.json().catch(() => ({})); setErr(j.error ?? "저장에 실패했습니다."); }
  }

  return (
    <div className="rounded-xl border p-6 max-w-md" style={cardStyle}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold" style={{ color: "#F0E6FF" }}>장바구니 잔존 쿠폰</h2>
        <button onClick={() => setEnabled((v) => !v)} className="text-xs px-3 py-1 rounded-full border transition-colors"
          style={{ background: enabled ? "#10B98122" : "#6B728022", borderColor: enabled ? "#10B98155" : "#2D2D4E", color: enabled ? "#10B981" : "#9CA3AF" }}>
          {enabled ? "활성" : "비활성"}
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
        장바구니에 담아두고 일정 기간 방문하지 않은 회원에게 <b>그 상품 한정 쿠폰</b>을 자동 발급(일 1회 cron). 장바구니 방문 시 자동 동기화 선행 필요.
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: "#9CA3AF" }}>쿠폰 이름(고객 표시)</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="장바구니 특별 할인"
            className={`w-full ${inputCls}`} style={{ ...inputStyle, color: "#F0E6FF" }} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <input type="number" min={1} max={365} step={1} value={days} onChange={(e) => setDays(e.target.value)} className={`w-20 ${inputCls}`} style={inputStyle} />
            <span className="text-sm" style={{ color: "#9CA3AF" }}>일 미방문</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" min={0} max={100} step={0.1} value={percent} onChange={(e) => setPercent(e.target.value)} className={`w-20 ${inputCls}`} style={inputStyle} />
            <span className="text-sm" style={{ color: "#9CA3AF" }}>% 할인</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" min={1} max={60} step={1} value={months} onChange={(e) => setMonths(e.target.value)} className={`w-16 ${inputCls}`} style={inputStyle} />
            <span className="text-sm" style={{ color: "#9CA3AF" }}>개월 유효</span>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50" style={saveBtnStyle}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      {err && <p className="text-sm mt-3" style={{ color: "#EF4444" }}>{err}</p>}
      {msg && <p className="text-sm mt-3" style={{ color: "#10B981" }}>{msg}</p>}
    </div>
  );
}
