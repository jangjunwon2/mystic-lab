"use client";

import { useState } from "react";

interface SignupCoupon {
  enabled: boolean;
  percent: number;
  months: number;
}

interface Props {
  initialRate: number; // 0~1
  initialSignupCoupon: SignupCoupon;
}

const cardStyle = { background: "#1A1A2E", borderColor: "#2D2D4E" } as const;
const inputStyle = { background: "#13131F", borderColor: "#2D2D4E", color: "#F59E0B" } as const;
const saveBtnStyle = { background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" } as const;

export default function SettingsAdminClient({ initialRate, initialSignupCoupon }: Props) {
  return (
    <div className="space-y-6">
      <PointRateCard initialRate={initialRate} />
      <SignupCouponCard initial={initialSignupCoupon} />
    </div>
  );
}

function PointRateCard({ initialRate }: { initialRate: number }) {
  // 화면에선 % 단위로 다룬다 (0.05 → 5)
  const [percent, setPercent] = useState(String(Math.round(initialRate * 1000) / 10));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    const pct = parseFloat(percent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setErr("적립률은 0~100% 사이여야 합니다.");
      return;
    }
    setSaving(true);
    setErr("");
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointEarnRate: pct / 100 }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("저장되었습니다.");
      setTimeout(() => setMsg(""), 2500);
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "저장에 실패했습니다.");
    }
  }

  return (
    <div className="rounded-xl border p-6 max-w-md" style={cardStyle}>
      <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>포인트 적립률</h2>
      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
        구매 금액 대비 마일리지 적립 비율. 예: 5 = 구매액의 5% 적립. (100P = $1)
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="w-32 px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500"
          style={inputStyle}
        />
        <span className="text-sm" style={{ color: "#9CA3AF" }}>%</span>
        <button
          onClick={save}
          disabled={saving}
          className="ml-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={saveBtnStyle}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      {err && <p className="text-sm mt-3" style={{ color: "#EF4444" }}>{err}</p>}
      {msg && <p className="text-sm mt-3" style={{ color: "#10B981" }}>{msg}</p>}
    </div>
  );
}

function SignupCouponCard({ initial }: { initial: SignupCoupon }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [percent, setPercent] = useState(String(initial.percent));
  const [months, setMonths] = useState(String(initial.months));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    const p = parseFloat(percent);
    const m = parseInt(months, 10);
    if (isNaN(p) || p <= 0 || p > 100) { setErr("할인율은 0~100% 사이여야 합니다."); return; }
    if (isNaN(m) || m <= 0 || m > 60) { setErr("유효기간은 1~60개월 사이여야 합니다."); return; }
    setSaving(true);
    setErr("");
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signupCoupon: { enabled, percent: p, months: m } }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("저장되었습니다.");
      setTimeout(() => setMsg(""), 2500);
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "저장에 실패했습니다.");
    }
  }

  return (
    <div className="rounded-xl border p-6 max-w-md" style={cardStyle}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold" style={{ color: "#F0E6FF" }}>가입 환영 쿠폰</h2>
        <button
          onClick={() => setEnabled((v) => !v)}
          className="text-xs px-3 py-1 rounded-full border transition-colors"
          style={{
            background: enabled ? "#10B98122" : "#6B728022",
            borderColor: enabled ? "#10B98155" : "#2D2D4E",
            color: enabled ? "#10B981" : "#9CA3AF",
          }}
        >
          {enabled ? "활성" : "비활성"}
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
        신규 회원에게 1회용 개인 쿠폰을 자동 발급(멱등)하고 안내 이메일을 보냅니다.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="number" min={0} max={100} step={0.1}
            value={percent} onChange={(e) => setPercent(e.target.value)}
            className="w-24 px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500" style={inputStyle}
          />
          <span className="text-sm" style={{ color: "#9CA3AF" }}>% 할인</span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number" min={1} max={60} step={1}
            value={months} onChange={(e) => setMonths(e.target.value)}
            className="w-20 px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500" style={inputStyle}
          />
          <span className="text-sm" style={{ color: "#9CA3AF" }}>개월 유효</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={saveBtnStyle}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      {err && <p className="text-sm mt-3" style={{ color: "#EF4444" }}>{err}</p>}
      {msg && <p className="text-sm mt-3" style={{ color: "#10B981" }}>{msg}</p>}
    </div>
  );
}
