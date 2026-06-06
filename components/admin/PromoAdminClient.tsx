"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";

interface PromoCoupon { id: string; code: string; name: string | null; type: string; value: number; scope: string }
interface PromoPage {
  id: string; slug: string; title: string; subtitle: string | null;
  description: string | null; image_url: string | null; badge_text: string | null;
  coupon_id: string | null; is_active: boolean; ends_at: string | null; created_at: string;
}

const EMPTY_FORM = { slug: "", title: "", subtitle: "", description: "", image_url: "", badge_text: "", coupon_id: "", ends_at: "" };

export default function PromoAdminClient({ initialPages, publicCoupons }: { initialPages: PromoPage[]; publicCoupons: PromoCoupon[] }) {
  const [pages, setPages] = useState<PromoPage[]>(initialPages);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() { setForm(EMPTY_FORM); setEditingId(null); setError(null); setShowForm(true); }
  function startEdit(p: PromoPage) {
    setForm({
      slug: p.slug, title: p.title, subtitle: p.subtitle ?? "", description: p.description ?? "",
      image_url: p.image_url ?? "", badge_text: p.badge_text ?? "",
      coupon_id: p.coupon_id ?? "", ends_at: p.ends_at ? p.ends_at.slice(0, 16) : "",
    });
    setEditingId(p.id);
    setError(null);
    setShowForm(true);
  }
  function cancelForm() { setShowForm(false); setEditingId(null); setError(null); }

  function set(k: keyof typeof EMPTY_FORM, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.title.trim() || !form.slug.trim()) { setError("슬러그와 제목은 필수입니다."); return; }
    setSaving(true); setError(null);
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      slug: form.slug.trim(), title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      badge_text: form.badge_text.trim() || null,
      coupon_id: form.coupon_id || null,
      ends_at: form.ends_at || null,
    };
    const res = await fetch("/api/admin/promo", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "저장 실패"); setSaving(false); return; }
    if (editingId) {
      setPages((prev) => prev.map((p) => p.id === editingId ? { ...p, ...payload } as PromoPage : p));
    } else {
      const newPage: PromoPage = { id: d.id, ...payload, is_active: true, created_at: new Date().toISOString() } as PromoPage;
      setPages((prev) => [newPage, ...prev]);
    }
    cancelForm();
    setSaving(false);
  }

  async function toggle(p: PromoPage) {
    const res = await fetch("/api/admin/promo", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
    });
    if (res.ok) setPages((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
  }

  async function remove(id: string) {
    if (!confirm("이 프로모 페이지를 삭제할까요?")) return;
    const res = await fetch("/api/admin/promo", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) setPages((prev) => prev.filter((p) => p.id !== id));
  }

  const fmt = (iso: string) => { try { return new Date(iso).toLocaleDateString("ko"); } catch { return iso.slice(0, 10); } };
  const couponLabel = (id: string | null) => {
    if (!id) return null;
    const c = publicCoupons.find((x) => x.id === id);
    return c ? `${c.name ?? c.code} (${c.type === "fixed" ? `$${c.value}` : `${c.value}%`} OFF)` : id.slice(0, 8);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "#9CA3AF" }}>{pages.length}개 페이지</p>
        <button onClick={startCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "#7C3AED" }}>
          <Plus className="w-4 h-4" /> 새 프로모 페이지
        </button>
      </div>

      {/* 생성/수정 폼 */}
      {showForm && (
        <div className="rounded-xl border p-5 mb-6 space-y-4" style={{ background: "#1A1A2E", borderColor: "#7C3AED" }}>
          <p className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>{editingId ? "페이지 수정" : "새 프로모 페이지 생성"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="슬러그 (URL)" hint="/promo/여기에-입력">
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="summer-sale-2026" className="field-input" />
            </Field>
            <Field label="제목 *">
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="여름 스페셜 이벤트" className="field-input" />
            </Field>
            <Field label="부제목">
              <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="구매자 한정 특별 혜택" className="field-input" />
            </Field>
            <Field label="배지 텍스트">
              <input value={form.badge_text} onChange={(e) => set("badge_text", e.target.value)} placeholder="한정 이벤트" className="field-input" />
            </Field>
            <Field label="히어로 이미지 URL">
              <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." className="field-input" />
            </Field>
            <Field label="종료일 (선택)">
              <input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} className="field-input" />
            </Field>
            <Field label="연결할 공개 쿠폰" className="sm:col-span-2">
              <select value={form.coupon_id} onChange={(e) => set("coupon_id", e.target.value)} className="field-input">
                <option value="">— 쿠폰 없음 —</option>
                {publicCoupons.map((c) => (
                  <option key={c.id} value={c.id}>{c.name ?? c.code} ({c.type === "fixed" ? `$${c.value}` : `${c.value}%`} OFF) [{c.code}]</option>
                ))}
              </select>
            </Field>
            <Field label="본문 설명" className="sm:col-span-2">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="이벤트 안내, 이용 방법 등..." className="field-input resize-none" />
            </Field>
          </div>

          {error && <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90" style={{ background: "#7C3AED" }}>
              <Check className="w-4 h-4" /> {saving ? "저장 중…" : "저장"}
            </button>
            <button onClick={cancelForm} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ background: "#13131F", color: "#9CA3AF" }}>
              <X className="w-4 h-4" /> 취소
            </button>
          </div>

          <style>{`.field-input { width: 100%; background: #13131F; border: 1px solid #2D2D4E; color: #F0E6FF; border-radius: 8px; padding: 8px 10px; font-size: 14px; outline: none; } .field-input::placeholder { color: #6B7280; } .field-input:focus { border-color: #7C3AED; }`}</style>
        </div>
      )}

      {/* 목록 */}
      {pages.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>아직 프로모 페이지가 없습니다. 위에서 생성하세요.</p>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <div key={p.id} className="rounded-xl border p-4" style={{ background: "#1A1A2E", borderColor: p.is_active ? "#2D2D4E" : "#1e1e3a" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${p.is_active ? "bg-emerald-400" : "bg-gray-600"}`} />
                    <span className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>{p.title}</span>
                    {p.badge_text && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.2)", color: "#A855F7" }}>{p.badge_text}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#0D0D1A", color: "#9CA3AF" }}>/promo/{p.slug}</code>
                    <a href={`/en/promo/${p.slug}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                      <ExternalLink className="w-3 h-3" style={{ color: "#6B7280" }} />
                    </a>
                  </div>
                  {couponLabel(p.coupon_id) && (
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>🎟️ {couponLabel(p.coupon_id)}</p>
                  )}
                  {p.ends_at && (
                    <p className="text-xs mt-0.5" style={{ color: new Date(p.ends_at) < new Date() ? "#EF4444" : "#F59E0B" }}>
                      ⏱ {fmt(p.ends_at)} 까지
                    </p>
                  )}
                  <p className="text-[11px] mt-1" style={{ color: "#4B5563" }}>생성: {fmt(p.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggle(p)} title={p.is_active ? "비활성화" : "활성화"} className="p-1.5 rounded hover:opacity-80">
                    {p.is_active ? <ToggleRight className="w-5 h-5" style={{ color: "#10B981" }} /> : <ToggleLeft className="w-5 h-5" style={{ color: "#6B7280" }} />}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:opacity-80" style={{ color: "#9CA3AF" }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:opacity-80" style={{ color: "#EF4444" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>{label}{hint && <span className="ml-1 opacity-60">{hint}</span>}</label>
      {children}
    </div>
  );
}
