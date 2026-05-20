"use client";

import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Megaphone } from "lucide-react";

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

export default function AnnouncementsAdminClient({ initialAnnouncements }: Props) {
  const [items, setItems] = useState<Announcement[]>(initialAnnouncements);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    message: "",
    link_url: "",
    link_label: "",
    is_active: true,
    starts_at: "",
    ends_at: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message) return;
    setLoadingId("new");

    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => [data, ...prev]);
      setForm({ message: "", link_url: "", link_label: "", is_active: true, starts_at: "", ends_at: "" });
      setCreating(false);
    } else {
      alert(data.error ?? "생성 실패");
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
          <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>Announcements</h1>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
            Active announcements appear at the top of every page on the store.
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          {creating ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border p-6 space-y-4"
          style={{ background: "#1A1A2E", borderColor: "#7C3AED" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "#A855F7" }}>New Announcement</h2>

          <label className="block space-y-1">
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Message *</span>
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
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Link URL (optional)</span>
              <input
                style={inputStyle}
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://..."
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Link Label (optional)</span>
              <input
                style={inputStyle}
                value={form.link_label}
                onChange={(e) => setForm({ ...form, link_label: e.target.value })}
                placeholder="Shop Now"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Starts At (optional)</span>
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Ends At (optional)</span>
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="text-sm" style={{ color: "#F0E6FF" }}>Active immediately</span>
          </label>

          <button
            type="submit"
            disabled={loadingId === "new"}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            {loadingId === "new" ? "Creating..." : "Create Announcement"}
          </button>
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
              className="rounded-xl border p-5 flex items-start justify-between gap-4"
              style={{
                background: "#1A1A2E",
                borderColor: item.is_active ? "#A855F7" : "#2D2D4E",
                opacity: loadingId === item.id ? 0.5 : 1,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "#F0E6FF" }}>{item.message}</p>
                {item.link_url && (
                  <p className="text-xs mt-1" style={{ color: "#A855F7" }}>
                    → {item.link_label ?? item.link_url}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: item.is_active ? "#10B98122" : "#EF444422",
                      color: item.is_active ? "#10B981" : "#EF4444",
                    }}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                  {item.ends_at && (
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>
                      Ends {new Date(item.ends_at).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "#4B5563" }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  disabled={loadingId === item.id}
                  title={item.is_active ? "Deactivate" : "Activate"}
                  style={{ color: item.is_active ? "#10B981" : "#9CA3AF" }}
                >
                  {item.is_active
                    ? <ToggleRight className="w-6 h-6" />
                    : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={loadingId === item.id}
                  title="Delete"
                  style={{ color: "#EF4444" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
