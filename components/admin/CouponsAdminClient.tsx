"use client";

import { useState } from "react";

export interface IssuedCoupon {
  id: string;
  code: string;
  email: string | null;
  user_id: string | null;
  type: "percent" | "fixed";
  value: number;
  source: string | null;
  min_order_usd: number;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "수동", newsletter: "뉴스레터", referral: "레퍼럴", signup: "가입", promo: "프로모션",
};

interface Props {
  initialCoupons: IssuedCoupon[];
}

export default function CouponsAdminClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState("");
  const [form, setForm] = useState({ email: "", type: "percent", value: "10", minOrderUsd: "0" });

  async function create() {
    const value = parseFloat(form.value);
    if (!form.email.trim()) { setError("이메일을 입력해주세요."); return; }
    if (isNaN(value) || value <= 0) { setError("할인 값을 입력해주세요."); return; }
    setCreating(true); setError(""); setIssued("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        type: form.type,
        value,
        minOrderUsd: parseFloat(form.minOrderUsd) || 0,
      }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) { setError(json.error ?? "발급에 실패했습니다."); return; }
    setIssued(json.code);
    // 목록 새로고침
    fetch("/api/admin/coupons").then((r) => r.json()).then((d) => Array.isArray(d) && setCoupons(d)).catch(() => {});
    setForm({ ...form, email: "" });
  }

  const fmt = (iso: string) => { try { return new Date(iso).toLocaleDateString("ko"); } catch { return iso.slice(0, 10); } };

  return (
    <div>
      <div className="rounded-xl border p-6 mb-8" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-base font-semibold mb-5" style={{ color: "#F0E6FF" }}>새 쿠폰 발급</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>대상 이메일 *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500" style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>유형</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500" style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" }}>
              <option value="percent">정률 (%)</option>
              <option value="fixed">정액 ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{form.type === "fixed" ? "할인액 ($)" : "할인율 (%)"}</label>
            <input type="number" min={0} step={0.01} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500" style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F59E0B" }} />
          </div>
        </div>
        {error && <p className="text-sm mb-3" style={{ color: "#EF4444" }}>{error}</p>}
        {issued && <p className="text-sm mb-3" style={{ color: "#10B981" }}>발급 완료: <span className="font-mono font-bold">{issued}</span></p>}
        <button onClick={create} disabled={creating} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}>
          {creating ? "발급 중…" : "쿠폰 발급"}
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["코드", "대상", "할인", "출처", "상태", "만료", "발급일"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color: "#9CA3AF" }}>발급된 쿠폰이 없습니다.</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "#2D2D4E" }}>
                    <td className="px-4 py-3"><span className="font-mono font-semibold" style={{ color: "#A855F7" }}>{c.code}</span></td>
                    <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{c.email ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: "#F59E0B" }}>{c.type === "fixed" ? `$${c.value}` : `${c.value}%`}</td>
                    <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{SOURCE_LABEL[c.source ?? ""] ?? c.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: c.is_used ? "#6B728022" : "#10B98122", color: c.is_used ? "#9CA3AF" : "#10B981" }}>
                        {c.is_used ? "사용됨" : "미사용"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6B7280" }}>{c.expires_at ? fmt(c.expires_at) : "무기한"}</td>
                    <td className="px-4 py-3" style={{ color: "#6B7280" }}>{fmt(c.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
