"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldOff, ShieldCheck, Ban, Plus, Trash2, Package, Play, Mail, UserCog, Clock } from "lucide-react";

interface Product { id: string; slug: string; product_translations: { name: string; language: string }[] }
interface Grant { id: string; note: string | null; expires_at: string | null; created_at: string; products: Product | null }
interface OrderItem { id: string; quantity: number; price_usd: number; products: Product | null }
interface Order { id: string; status: string; total_usd: number; created_at: string; order_items: OrderItem[] }
interface Profile { id: string; display_name: string | null; role: string; status: string; suspension_reason: string | null; admin_notes: string | null; created_at: string }

interface Props {
  profile: Profile;
  email: string | null;
  orders: Order[];
  grants: Grant[];
  allProducts: { id: string; slug: string; name: string }[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)",  color: "#10B981", label: "활성" },
  suspended: { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B", label: "정지" },
  banned:    { bg: "rgba(239,68,68,0.12)",   color: "#EF4444", label: "영구 차단" },
  dormant:   { bg: "rgba(99,102,241,0.12)",  color: "#818CF8", label: "휴면" },
};

export default function UserDetailClient({ profile: initialProfile, email, orders, grants: initialGrants, allProducts }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [grants, setGrants] = useState(initialGrants);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantProductId, setGrantProductId] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [grantExpiry, setGrantExpiry] = useState("");
  const [savingGrant, setSavingGrant] = useState(false);
  const [adminNotes, setAdminNotes] = useState(initialProfile.admin_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesStatus, setNotesStatus] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  const st = STATUS_STYLES[profile.status] ?? STATUS_STYLES.active;

  async function updateStatus(status: string, reason?: string) {
    setLoadingStatus(true);
    const res = await fetch(`/api/admin/users/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, suspension_reason: reason ?? null }),
    });
    if (res.ok) setProfile((p) => ({ ...p, status, suspension_reason: reason ?? null }));
    setLoadingStatus(false);
  }

  async function toggleRole() {
    const nextRole = profile.role === "admin" ? "user" : "admin";
    const msg = nextRole === "admin"
      ? `${profile.display_name ?? profile.id}을(를) 어드민으로 승급할까요?`
      : `${profile.display_name ?? profile.id}의 어드민 권한을 해제할까요?`;
    if (!window.confirm(msg)) return;
    setLoadingRole(true);
    const res = await fetch(`/api/admin/users/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) setProfile((p) => ({ ...p, role: nextRole }));
    setLoadingRole(false);
  }

  async function handleSuspend() {
    const reason = window.prompt("정지 사유:");
    if (reason === null) return;
    await updateStatus("suspended", reason);
  }

  async function addGrant() {
    if (!grantProductId) return;
    setSavingGrant(true);
    const res = await fetch(`/api/admin/users/${profile.id}/grants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: grantProductId,
        note: grantNote || null,
        expires_at: grantExpiry || null,
      }),
    });
    if (res.ok) {
      const grant = await res.json();
      const prod = allProducts.find((p) => p.id === grantProductId);
      setGrants((prev) => [
        ...prev,
        {
          ...grant,
          products: prod
            ? { id: prod.id, slug: prod.slug, product_translations: [{ name: prod.name, language: "en" }] }
            : null,
        },
      ]);
      setShowGrantForm(false);
      setGrantProductId("");
      setGrantNote("");
      setGrantExpiry("");
    }
    setSavingGrant(false);
  }

  async function revokeGrant(grantId: string) {
    if (!window.confirm("이 영상 접근 권한을 취소할까요?")) return;
    const res = await fetch(`/api/admin/users/${profile.id}/grants?grant_id=${grantId}`, { method: "DELETE" });
    if (res.ok) setGrants((prev) => prev.filter((g) => g.id !== grantId));
  }

  async function saveNotes() {
    setSavingNotes(true);
    setNotesStatus("");
    const res = await fetch(`/api/admin/users/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
    setSavingNotes(false);
    setNotesStatus(res.ok ? "✅ 저장됨." : "❌ 실패.");
    setTimeout(() => setNotesStatus(""), 3000);
  }

  async function sendEmail() {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailStatus("❌ 제목과 내용을 입력해주세요.");
      return;
    }
    setSendingEmail(true);
    setEmailStatus("");
    const res = await fetch(`/api/admin/users/${profile.id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
    });
    setSendingEmail(false);
    if (res.ok) {
      setEmailStatus("✅ 이메일 발송 완료.");
      setEmailSubject("");
      setEmailMessage("");
    } else {
      const data = await res.json();
      setEmailStatus(`❌ ${data.error ?? "발송 실패."}`);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#0D0D1A", border: "1px solid #2D2D4E",
    borderRadius: "8px", color: "#F0E6FF", padding: "6px 10px", fontSize: "13px",
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Profile header */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-0.5" style={{ color: "#F0E6FF" }}>
              {profile.display_name ?? "이름 없음"}
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>{email ?? "—"}</p>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              가입일: {new Date(profile.created_at).toLocaleDateString()} · 역할: {profile.role}
            </p>
            {profile.suspension_reason && (
              <p className="text-xs mt-1" style={{ color: "#F59E0B" }}>
                사유: {profile.suspension_reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
              {st.label ?? profile.status}
            </span>
            <button
              onClick={toggleRole}
              disabled={loadingRole}
              title={profile.role === "admin" ? "일반 회원으로 변경" : "어드민으로 승급"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={
                profile.role === "admin"
                  ? { background: "rgba(107,114,128,0.15)", color: "#9CA3AF", border: "1px solid #2D2D4E" }
                  : { background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }
              }
            >
              <UserCog className="w-3.5 h-3.5" />
              {profile.role === "admin" ? "일반 회원으로 변경" : "어드민으로 승급"}
            </button>
            {profile.role !== "admin" && (
              <>
                {profile.status === "active" && (
                  <>
                    <button
                      onClick={handleSuspend}
                      disabled={loadingStatus}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
                    >
                      <ShieldOff className="w-3.5 h-3.5" /> 정지
                    </button>
                    <button
                      onClick={() => { if (window.confirm("휴면 처리하시겠습니까?")) updateStatus("dormant"); }}
                      disabled={loadingStatus}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#818CF8" }}
                    >
                      <Clock className="w-3.5 h-3.5" /> 휴면
                    </button>
                    <button
                      onClick={() => { if (window.confirm("영구 차단하시겠습니까?")) updateStatus("banned"); }}
                      disabled={loadingStatus}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                    >
                      <Ban className="w-3.5 h-3.5" /> 영구 차단
                    </button>
                  </>
                )}
                {(profile.status === "suspended" || profile.status === "banned" || profile.status === "dormant") && (
                  <button
                    onClick={() => updateStatus("active", "")}
                    disabled={loadingStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> 활성화
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Manual video grants */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: "#F0E6FF" }}>
            <Play className="w-4 h-4 text-[#A855F7]" /> 영상 접근 수동 부여
          </h3>
          <button
            onClick={() => setShowGrantForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid rgba(124,58,237,0.4)" }}
          >
            <Plus className="w-3.5 h-3.5" /> 접근 부여
          </button>
        </div>

        {showGrantForm && (
          <div className="mb-4 p-4 rounded-lg space-y-3" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">상품</label>
              <select
                value={grantProductId}
                onChange={(e) => setGrantProductId(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              >
                <option value="">— 상품 선택 —</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">메모 (선택)</label>
              <input
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="예: CS 보상, 리뷰어 접근"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">만료일 (선택, 비워두면 영구)</label>
              <input
                type="datetime-local"
                value={grantExpiry}
                onChange={(e) => setGrantExpiry(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addGrant}
                disabled={savingGrant || !grantProductId}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "#7C3AED", color: "#fff" }}
              >
                {savingGrant ? "저장 중…" : "저장"}
              </button>
              <button
                onClick={() => setShowGrantForm(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#2D2D4E", color: "#9CA3AF" }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {grants.length === 0 ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>수동 부여 내역 없음.</p>
        ) : (
          <div className="space-y-2">
            {grants.map((g) => {
              const name = g.products?.product_translations.find((t) => t.language === "en")?.name
                ?? g.products?.slug ?? "알 수 없는 상품";
              const expired = g.expires_at && new Date(g.expires_at) < new Date();
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                  style={{ background: "#13131F" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: expired ? "#6B7280" : "#F0E6FF" }}>
                      {name} {expired && <span style={{ color: "#EF4444" }}>(만료됨)</span>}
                    </p>
                    {g.note && <p className="text-xs" style={{ color: "#9CA3AF" }}>{g.note}</p>}
                    <p className="text-xs" style={{ color: "#6B7280" }}>
                      {g.expires_at
                        ? `만료: ${new Date(g.expires_at).toLocaleDateString()}`
                        : "영구"
                      } · 부여일: {new Date(g.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeGrant(g.id)}
                    className="p-1.5 rounded transition-colors hover:opacity-80"
                    style={{ color: "#EF4444" }}
                    title="취소"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "#F0E6FF" }}>
          <Package className="w-4 h-4 text-[#A855F7]" /> 주문 ({orders.length})
        </h3>
        {orders.length === 0 ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>주문 없음.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                style={{ background: "#13131F" }}
              >
                <div>
                  <p className="text-xs font-mono" style={{ color: "#6B7280" }}>
                    #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    {o.order_items.map((i) => {
                      const name = i.products?.product_translations.find((t) => t.language === "en")?.name ?? i.products?.slug ?? "?";
                      return `${name} ×${i.quantity}`;
                    }).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: "#A855F7" }}>${o.total_usd.toFixed(2)}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {o.status} · {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin notes */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "#F0E6FF" }}>
          내부 메모 <span className="text-xs font-normal" style={{ color: "#6B7280" }}>(회원에게 미표시)</span>
        </h3>
        <textarea
          rows={4}
          placeholder="이 회원에 대한 내부 메모를 입력하세요..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          style={{ ...inputStyle, width: "100%", resize: "vertical" }}
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#2D2D4E", color: "#F0E6FF" }}
          >
            {savingNotes ? "저장 중…" : "메모 저장"}
          </button>
          {notesStatus && (
            <span className="text-xs" style={{ color: notesStatus.startsWith("✅") ? "#10B981" : "#EF4444" }}>
              {notesStatus}
            </span>
          )}
        </div>
      </div>

      {/* Send email */}
      {email && (
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "#F0E6FF" }}>
            <Mail className="w-4 h-4 text-[#A855F7]" /> {email}에게 이메일 발송
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="제목"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            />
            <textarea
              rows={4}
              placeholder="메시지를 입력하세요..."
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              style={{ ...inputStyle, width: "100%", resize: "vertical" }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={sendEmail}
                disabled={sendingEmail}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
              >
                {sendingEmail ? "발송 중…" : "이메일 발송"}
              </button>
              {emailStatus && (
                <span
                  className="text-xs"
                  style={{ color: emailStatus.startsWith("✅") ? "#10B981" : "#EF4444" }}
                >
                  {emailStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
        style={{ color: "#9CA3AF" }}
      >
        ← 회원 목록으로
      </Link>
    </div>
  );
}
