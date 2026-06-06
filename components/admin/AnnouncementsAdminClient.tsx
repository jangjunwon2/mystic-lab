"use client";

import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Megaphone, Pencil, Check, X } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface Props {
  initialAnnouncements: Announcement[];
}

const inputStyle: React.CSSProperties = {
  background: "#0D0D1A",
  border: "1px solid #2D2D4E",
  borderRadius: "8px",
  color: "#F0E6FF",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
};

const emptyForm = { message: "", link_url: "", link_label: "", coupon_code: "", is_active: true, starts_at: "", ends_at: "" };

function AnnouncementForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
}: {
  initial: typeof emptyForm;
  onSubmit: (f: typeof emptyForm) => void;
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className="text-xs" style={{ color: "#9CA3AF" }}>공지 내용 *</span>
        <textarea
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="🎉 Summer sale — 20% off all electronic devices this week!"
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "#9CA3AF" }}>링크 URL (선택)</span>
          <input style={inputStyle} value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "#9CA3AF" }}>링크 텍스트 (선택)</span>
          <input style={inputStyle} value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} placeholder="지금 보기" />
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "#9CA3AF" }}>쿠폰 코드 (선택 — 배너에 표시)</span>
          <input style={inputStyle} value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "#9CA3AF" }}>시작일 (선택)</span>
          <input type="datetime-local" style={inputStyle} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-xs" style={{ color: "#9CA3AF" }}>종료일 (선택)</span>
          <input type="datetime-local" style={inputStyle} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-purple-600" />
        <span className="text-sm" style={{ color: "#F0E6FF" }}>즉시 활성화</span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => { if (form.message) onSubmit(form); }}
          disabled={loading || !form.message}
          className="px-6 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          {loading ? "저장 중..." : submitLabel}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm" style={{ background: "#2D2D4E", color: "#9CA3AF" }}>
          취소
        </button>
      </div>
    </div>
  );
}

export default function AnnouncementsAdminClient({ initialAnnouncements }: Props) {
  const [items, setItems] = useState<Announcement[]>(initialAnnouncements);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleCreate(form: typeof emptyForm) {
    setLoadingId("new");
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => [data, ...prev]);
      setCreating(false);
    } else {
      alert(data.error ?? "생성 실패");
    }
    setLoadingId(null);
  }

  async function handleEdit(item: Announcement, form: typeof emptyForm) {
    setLoadingId(item.id);
    const res = await fetch(`/api/admin/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: form.message,
        link_url: form.link_url || null,
        link_label: form.link_label || null,
        coupon_code: form.coupon_code || null,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((a) => a.id === item.id ? {
        ...a,
        message: form.message,
        link_url: form.link_url || null,
        link_label: form.link_label || null,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      } : a));
      setEditingId(null);
    } else {
      alert("수정에 실패했습니다.");
    }
    setLoadingId(null);
  }

  async function toggleActive(item: Announcement) {
    setLoadingId(item.id);
    const res = await fetch(`/api/admin/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((a) => a.id === item.id ? { ...a, is_active: !a.is_active } : a));
    }
    setLoadingId(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((a) => a.id !== id));
    setLoadingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>공지 관리</h1>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
            활성화된 공지는 스토어의 모든 페이지 상단에 표시됩니다.
          </p>
        </div>
        <button
          onClick={() => { setCreating(!creating); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          {creating ? "취소" : "새 공지"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="rounded-xl border p-6"
          style={{ background: "#1A1A2E", borderColor: "#7C3AED" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#A855F7" }}>새 공지 작성</h2>
          <AnnouncementForm
            initial={emptyForm}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            submitLabel="공지 생성"
            loading={loadingId === "new"}
          />
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "#9CA3AF" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>공지가 없습니다.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border"
              style={{
                background: "#1A1A2E",
                borderColor: item.is_active ? "#A855F7" : "#2D2D4E",
                opacity: loadingId === item.id ? 0.5 : 1,
              }}
            >
              {editingId === item.id ? (
                <div className="p-5">
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "#A855F7" }}>공지 수정</h3>
                  <AnnouncementForm
                    initial={{
                      message: item.message,
                      link_url: item.link_url ?? "",
                      link_label: item.link_label ?? "",
                      coupon_code: "",
                      is_active: item.is_active,
                      starts_at: item.starts_at ? item.starts_at.slice(0, 16) : "",
                      ends_at: item.ends_at ? item.ends_at.slice(0, 16) : "",
                    }}
                    onSubmit={(form) => handleEdit(item, form)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="수정 저장"
                    loading={loadingId === item.id}
                  />
                </div>
              ) : (
                <div className="p-5">
                  {/* 상태 배지 + 날짜 */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: item.is_active ? "#10B98122" : "#EF444422",
                        color: item.is_active ? "#10B981" : "#EF4444",
                      }}
                    >
                      {item.is_active ? "활성" : "비활성"}
                    </span>
                    {item.ends_at && (
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>
                        종료 {new Date(item.ends_at).toLocaleDateString()}
                      </span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: "#4B5563" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* 본문 */}
                  <p className="text-sm whitespace-pre-wrap break-words mb-1" style={{ color: "#F0E6FF" }}>
                    {item.message}
                  </p>
                  {item.link_url && (
                    <p className="text-xs" style={{ color: "#A855F7" }}>
                      → {item.link_label ?? item.link_url}
                    </p>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #2D2D4E" }}>
                    <button
                      onClick={() => { setEditingId(item.id); setCreating(false); }}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                      style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid rgba(124,58,237,0.3)" }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> 수정
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                      style={{
                        background: item.is_active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                        color: item.is_active ? "#EF4444" : "#10B981",
                        border: `1px solid ${item.is_active ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                      }}
                    >
                      {item.is_active ? <><X className="w-3.5 h-3.5" /> 비활성화</> : <><Check className="w-3.5 h-3.5" /> 활성화</>}
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 ml-auto"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
