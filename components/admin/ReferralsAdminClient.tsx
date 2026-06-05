"use client";

import { useState } from "react";

interface ReferralCode {
  id: string;
  code: string;
  referrer_name: string;
  referrer_email: string | null;
  discount_percent: number;
  discount_type?: string;
  referrer_reward_type?: string | null;
  referrer_reward_value?: number;
  uses: number;
  is_active: boolean;
  created_at: string;
}

interface Props {
  initialCodes: ReferralCode[];
}

export default function ReferralsAdminClient({ initialCodes }: Props) {
  const [codes, setCodes] = useState(initialCodes);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    referrer_name: "",
    referrer_email: "",
    discount_percent: "0",
    discount_type: "percent",
    referrer_reward_type: "none",
    referrer_reward_value: "0",
  });

  async function create() {
    if (!form.code.trim() || !form.referrer_name.trim()) {
      setError("코드와 추천인 이름을 입력해주세요.");
      return;
    }
    const pct = parseFloat(form.discount_percent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("할인율은 0~100 사이여야 합니다.");
      return;
    }

    setCreating(true);
    setError("");

    const res = await fetch("/api/admin/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        referrer_name: form.referrer_name.trim(),
        referrer_email: form.referrer_email.trim() || undefined,
        discount_percent: pct,
        discount_type: form.discount_type,
        referrer_reward_type: form.referrer_reward_type,
        referrer_reward_value: parseFloat(form.referrer_reward_value) || 0,
      }),
    });

    const json = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(json.error ?? "레퍼럴 코드 생성에 실패했습니다.");
    } else {
      setCodes((prev) => [json as ReferralCode, ...prev]);
      setForm({ code: "", referrer_name: "", referrer_email: "", discount_percent: "0", discount_type: "percent", referrer_reward_type: "none", referrer_reward_value: "0" });
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setLoadingId(id);
    const res = await fetch(`/api/admin/referrals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)));
    }
    setLoadingId(null);
  }

  async function remove(id: string, code: string) {
    if (!confirm(`레퍼럴 코드 "${code}"를 삭제할까요?`)) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/referrals/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
    setLoadingId(null);
  }

  return (
    <div>
      {/* Create form */}
      <div
        className="rounded-xl border p-6 mb-8"
        style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
      >
        <h2 className="text-base font-semibold mb-5" style={{ color: "#F0E6FF" }}>
          새 레퍼럴 코드
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              코드 *
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. MAGIC2025"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors font-mono"
              style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#A855F7" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              추천인 이름 *
            </label>
            <input
              type="text"
              value={form.referrer_name}
              onChange={(e) => setForm({ ...form, referrer_name: e.target.value })}
              placeholder="John Smith"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
              style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              추천인 이메일
            </label>
            <input
              type="email"
              value={form.referrer_email}
              onChange={(e) => setForm({ ...form, referrer_email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
              style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              신규 구매자 할인 유형
            </label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
              style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" }}
            >
              <option value="percent">정률 (%)</option>
              <option value="fixed">정액 ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              신규 구매자 할인 {form.discount_type === "fixed" ? "($)" : "(%)"}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
              style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F59E0B" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              추천인 보상 (쿠폰 발급)
            </label>
            <select
              value={form.referrer_reward_type}
              onChange={(e) => setForm({ ...form, referrer_reward_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
              style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" }}
            >
              <option value="none">없음</option>
              <option value="percent">정률 쿠폰 (%)</option>
              <option value="fixed">정액 쿠폰 ($)</option>
            </select>
          </div>
          {form.referrer_reward_type !== "none" && (
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                추천인 보상 값 {form.referrer_reward_type === "fixed" ? "($)" : "(%)"}
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.referrer_reward_value}
                onChange={(e) => setForm({ ...form, referrer_reward_value: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
                style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#F59E0B" }}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#EF4444" }}>
            {error}
          </p>
        )}

        <button
          onClick={create}
          disabled={creating}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
        >
          {creating ? "생성 중…" : "코드 생성"}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["코드", "추천인", "할인/보상", "사용 횟수", "상태", "관리"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    아직 레퍼럴 코드가 없습니다.
                  </td>
                </tr>
              ) : (
                codes.map((rc) => (
                  <tr
                    key={rc.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "#2D2D4E", opacity: loadingId === rc.id ? 0.5 : 1 }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold" style={{ color: "#A855F7" }}>
                        {rc.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p style={{ color: "#F0E6FF" }}>{rc.referrer_name}</p>
                      {rc.referrer_email && (
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {rc.referrer_email}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium" style={{ color: "#F59E0B" }}>
                      {rc.discount_percent > 0 ? (rc.discount_type === "fixed" ? `$${rc.discount_percent}` : `${rc.discount_percent}%`) : "—"}
                      {rc.referrer_reward_type && (rc.referrer_reward_value ?? 0) > 0 && (
                        <span className="block text-[11px]" style={{ color: "#A855F7" }}>
                          추천인 {rc.referrer_reward_type === "fixed" ? `$${rc.referrer_reward_value}` : `${rc.referrer_reward_value}%`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4" style={{ color: "#F0E6FF" }}>
                      {rc.uses}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(rc.id, rc.is_active)}
                        disabled={loadingId === rc.id}
                        className="px-2 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                        style={{
                          background: rc.is_active ? "#10B98122" : "#EF444422",
                          color: rc.is_active ? "#10B981" : "#EF4444",
                        }}
                      >
                        {rc.is_active ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => remove(rc.id, rc.code)}
                        disabled={loadingId === rc.id}
                        className="text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#EF4444" }}
                      >
                        삭제
                      </button>
                    </td>
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
