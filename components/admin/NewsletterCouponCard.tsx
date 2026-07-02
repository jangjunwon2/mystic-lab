"use client";

import { useState } from "react";
import { CARD_STYLE, INPUT_STYLE_DARK, SAVE_BTN_STYLE, INPUT_CLS } from "./ui/styles";

export interface NewsletterCoupon {
  percent: number;
}

export default function NewsletterCouponCard({ initial }: { initial: NewsletterCoupon }) {
  const [enabled, setEnabled] = useState(initial.percent > 0);
  const [percent, setPercent] = useState(String(initial.percent > 0 ? initial.percent : "10"));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    const p = enabled ? parseFloat(percent) : 0;
    if (enabled && (isNaN(p) || p <= 0 || p > 100)) {
      setErr("할인율은 0~100% 사이여야 합니다.");
      return;
    }
    setSaving(true);
    setErr("");
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsletterCoupon: { percent: p } }),
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

  const handleToggle = () => {
    setEnabled((v) => {
      const next = !v;
      if (next && percent === "0") {
        setPercent("10");
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border p-6 max-w-md" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold" style={{ color: "#F0E6FF" }}>뉴스레터 웰컴 쿠폰</h2>
        <button
          onClick={handleToggle}
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
        뉴스레터를 새로 구독한 이메일로 1회용 개인 쿠폰을 자동 발급하고 이메일을 전송합니다.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            disabled={!enabled}
            value={enabled ? percent : "0"}
            onChange={(e) => setPercent(e.target.value)}
            className={`w-24 ${INPUT_CLS}`}
            style={{
              ...INPUT_STYLE_DARK,
              opacity: enabled ? 1 : 0.5,
              cursor: enabled ? "text" : "not-allowed",
            }}
          />
          <span className="text-sm" style={{ color: "#9CA3AF" }}>% 할인</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={SAVE_BTN_STYLE}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      {err && <p className="text-sm mt-3" style={{ color: "#EF4444" }}>{err}</p>}
      {msg && <p className="text-sm mt-3" style={{ color: "#10B981" }}>{msg}</p>}
    </div>
  );
}
