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
  scope: "personal" | "public" | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
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

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500";
const inputStyle = { background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" } as const;
const labelCls = "block text-xs font-medium mb-1.5 uppercase tracking-wider";

export default function CouponsAdminClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState(initialCoupons);

  // 개인 쿠폰 폼
  const [pCreating, setPCreating] = useState(false);
  const [pError, setPError] = useState("");
  const [pIssued, setPIssued] = useState("");
  const [pForm, setPForm] = useState({ email: "", type: "percent", value: "10", minOrderUsd: "0" });

  // 공개 쿠폰 폼
  const [bCreating, setBCreating] = useState(false);
  const [bError, setBError] = useState("");
  const [bIssued, setBIssued] = useState("");
  const [bForm, setBForm] = useState({ code: "", type: "percent", value: "10", maxUses: "", minOrderUsd: "" });

  async function refresh() {
    fetch("/api/admin/coupons").then((r) => r.json()).then((d) => Array.isArray(d) && setCoupons(d)).catch(() => {});
  }

  async function createPersonal() {
    const value = parseFloat(pForm.value);
    if (!pForm.email.trim()) { setPError("이메일을 입력해주세요."); return; }
    if (isNaN(value) || value <= 0) { setPError("할인 값을 입력해주세요."); return; }
    setPCreating(true); setPError(""); setPIssued("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "personal",
        email: pForm.email.trim(),
        type: pForm.type,
        value,
        minOrderUsd: parseFloat(pForm.minOrderUsd) || 0,
      }),
    });
    const json = await res.json();
    setPCreating(false);
    if (!res.ok) { setPError(json.error ?? "발급에 실패했습니다."); return; }
    setPIssued(json.code);
    refresh();
    setPForm({ ...pForm, email: "" });
  }

  async function createPublic() {
    const value = parseFloat(bForm.value);
    if (isNaN(value) || value <= 0) { setBError("할인 값을 입력해주세요."); return; }
    setBCreating(true); setBError(""); setBIssued("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "public",
        code: bForm.code.trim() || undefined,
        type: bForm.type,
        value,
        maxUses: bForm.maxUses.trim() === "" ? null : parseInt(bForm.maxUses, 10),
        minOrderUsd: parseFloat(bForm.minOrderUsd) || 0,
      }),
    });
    const json = await res.json();
    setBCreating(false);
    if (!res.ok) { setBError(json.error ?? "발급에 실패했습니다."); return; }
    setBIssued(json.code);
    refresh();
    setBForm({ ...bForm, code: "" });
  }

  const fmt = (iso: string) => { try { return new Date(iso).toLocaleDateString("ko"); } catch { return iso.slice(0, 10); } };

  const usageLabel = (c: IssuedCoupon) => {
    if ((c.scope ?? "personal") === "public") {
      const total = c.max_uses == null ? "∞" : c.max_uses;
      return `${c.used_count ?? 0} / ${total}`;
    }
    return c.is_used ? "사용됨" : "미사용";
  };
  const usageActive = (c: IssuedCoupon) => {
    if ((c.scope ?? "personal") === "public") {
      return c.is_active && (c.max_uses == null || (c.used_count ?? 0) < c.max_uses);
    }
    return !c.is_used;
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 개인 쿠폰 */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>개인 쿠폰</h2>
          <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>특정 이메일 1회용. 로그인 사용자만 사용 가능.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>대상 이메일 *</label>
              <input type="email" value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} placeholder="user@example.com"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>유형</label>
              <select value={pForm.type} onChange={(e) => setPForm({ ...pForm, type: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="percent">정률 (%)</option>
                <option value="fixed">정액 ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>{pForm.type === "fixed" ? "할인액 ($)" : "할인율 (%)"}</label>
              <input type="number" min={0} step={0.01} value={pForm.value} onChange={(e) => setPForm({ ...pForm, value: e.target.value })}
                className={inputCls} style={{ ...inputStyle, color: "#F59E0B" }} />
            </div>
          </div>
          {pError && <p className="text-sm mb-3" style={{ color: "#EF4444" }}>{pError}</p>}
          {pIssued && <p className="text-sm mb-3" style={{ color: "#10B981" }}>발급 완료: <span className="font-mono font-bold">{pIssued}</span></p>}
          <button onClick={createPersonal} disabled={pCreating} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}>
            {pCreating ? "발급 중…" : "개인 쿠폰 발급"}
          </button>
        </div>

        {/* 공개 쿠폰 */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>공개 쿠폰</h2>
          <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>누구나 쓰는 다회용 할인코드. 비워두면 코드 자동 생성. (구 할인코드 대체)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>코드 (선택)</label>
              <input type="text" value={bForm.code} onChange={(e) => setBForm({ ...bForm, code: e.target.value })} placeholder="자동 생성하려면 비워두세요"
                className={inputCls} style={{ ...inputStyle, fontFamily: "monospace" }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>유형</label>
              <select value={bForm.type} onChange={(e) => setBForm({ ...bForm, type: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="percent">정률 (%)</option>
                <option value="fixed">정액 ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>{bForm.type === "fixed" ? "할인액 ($)" : "할인율 (%)"}</label>
              <input type="number" min={0} step={0.01} value={bForm.value} onChange={(e) => setBForm({ ...bForm, value: e.target.value })}
                className={inputCls} style={{ ...inputStyle, color: "#F59E0B" }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>최대 사용 횟수 (선택)</label>
              <input type="number" min={1} step={1} value={bForm.maxUses} onChange={(e) => setBForm({ ...bForm, maxUses: e.target.value })} placeholder="무제한"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>최소 주문액 ($, 선택)</label>
              <input type="number" min={0} step={0.01} value={bForm.minOrderUsd} onChange={(e) => setBForm({ ...bForm, minOrderUsd: e.target.value })} placeholder="0"
                className={inputCls} style={inputStyle} />
            </div>
          </div>
          {bError && <p className="text-sm mb-3" style={{ color: "#EF4444" }}>{bError}</p>}
          {bIssued && <p className="text-sm mb-3" style={{ color: "#10B981" }}>발급 완료: <span className="font-mono font-bold">{bIssued}</span></p>}
          <button onClick={createPublic} disabled={bCreating} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}>
            {bCreating ? "발급 중…" : "공개 쿠폰 발급"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["코드", "범위", "대상", "할인", "출처", "사용", "만료", "발급일"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: "#9CA3AF" }}>발급된 쿠폰이 없습니다.</td></tr>
              ) : (
                coupons.map((c) => {
                  const isPublic = (c.scope ?? "personal") === "public";
                  const active = usageActive(c);
                  return (
                    <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "#2D2D4E" }}>
                      <td className="px-4 py-3"><span className="font-mono font-semibold" style={{ color: "#A855F7" }}>{c.code}</span></td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: isPublic ? "#7C3AED22" : "#6B728022", color: isPublic ? "#A855F7" : "#9CA3AF" }}>
                          {isPublic ? "공개" : "개인"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{c.email ?? (isPublic ? "—" : "—")}</td>
                      <td className="px-4 py-3" style={{ color: "#F59E0B" }}>{c.type === "fixed" ? `$${c.value}` : `${c.value}%`}</td>
                      <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{SOURCE_LABEL[c.source ?? ""] ?? c.source ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: active ? "#10B98122" : "#6B728022", color: active ? "#10B981" : "#9CA3AF" }}>
                          {usageLabel(c)}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>{c.expires_at ? fmt(c.expires_at) : "무기한"}</td>
                      <td className="px-4 py-3" style={{ color: "#6B7280" }}>{fmt(c.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
