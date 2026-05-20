"use client";

import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";

interface DiscountCode {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  initialCodes: DiscountCode[];
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

export default function DiscountsAdminClient({ initialCodes }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    max_uses: "",
    expires_at: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) return;
    setLoadingId("new");

    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setCodes((prev) => [data, ...prev]);
      setForm({ code: "", type: "percent", value: "", max_uses: "", expires_at: "" });
      setCreating(false);
    } else {
      alert(data.error ?? "생성 실패");
    }
    setLoadingId(null);
  }

  async function toggleActive(code: DiscountCode) {
    setLoadingId(code.id);
    const res = await fetch(`/api/admin/discounts/${code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !code.is_active }),
    });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => c.id === code.id ? { ...c, is_active: !c.is_active } : c));
    }
    setLoadingId(null);
  }

  async function deleteCode(id: string) {
    if (!confirm("이 할인 코드를 삭제하시겠습니까?")) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    if (res.ok) setCodes((prev) => prev.filter((c) => c.id !== id));
    setLoadingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          Discount Codes
        </h1>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          {creating ? "Cancel" : "New Code"}
        </button>
      </div>

      {/* Create Form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border p-6 space-y-4"
          style={{ background: "#1A1A2E", borderColor: "#7C3AED" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "#A855F7" }}>
            Create Discount Code
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Code *</span>
              <input
                style={inputStyle}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MAGIC20"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Type *</span>
              <select
                style={inputStyle}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>
                Value * {form.type === "percent" ? "(%)" : "(USD)"}
              </span>
              <input
                type="number"
                min="0"
                max={form.type === "percent" ? "100" : undefined}
                step="0.01"
                style={inputStyle}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percent" ? "20" : "15.00"}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Max Uses (optional)</span>
              <input
                type="number"
                min="1"
                style={inputStyle}
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unlimited"
              />
            </label>

            <label className="col-span-2 space-y-1">
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Expires At (optional)</span>
              <input
                type="datetime-local"
                style={inputStyle}
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loadingId === "new"}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            {loadingId === "new" ? "Creating..." : "Create Code"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        {codes.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "#9CA3AF" }}>
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">할인 코드가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                  {["Code", "Type", "Value", "Used / Max", "Expires", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => {
                  const expired = code.expires_at && new Date(code.expires_at) < new Date();
                  return (
                    <tr
                      key={code.id}
                      className="border-b last:border-0"
                      style={{
                        borderColor: "#2D2D4E",
                        opacity: loadingId === code.id ? 0.5 : 1,
                      }}
                    >
                      <td className="px-5 py-3 font-mono font-bold" style={{ color: "#A855F7" }}>
                        {code.code}
                      </td>
                      <td className="px-5 py-3" style={{ color: "#9CA3AF" }}>
                        {code.type}
                      </td>
                      <td className="px-5 py-3" style={{ color: "#F0E6FF" }}>
                        {code.type === "percent" ? `${code.value}%` : `$${code.value}`}
                      </td>
                      <td className="px-5 py-3" style={{ color: "#F0E6FF" }}>
                        {code.used_count} / {code.max_uses ?? "∞"}
                      </td>
                      <td className="px-5 py-3" style={{ color: expired ? "#EF4444" : "#9CA3AF" }}>
                        {code.expires_at
                          ? new Date(code.expires_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: (code.is_active && !expired) ? "#10B98122" : "#EF444422",
                            color: (code.is_active && !expired) ? "#10B981" : "#EF4444",
                          }}
                        >
                          {expired ? "Expired" : code.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(code)}
                            disabled={loadingId === code.id}
                            title={code.is_active ? "Deactivate" : "Activate"}
                            style={{ color: code.is_active ? "#10B981" : "#9CA3AF" }}
                          >
                            {code.is_active
                              ? <ToggleRight className="w-5 h-5" />
                              : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => deleteCode(code.id)}
                            disabled={loadingId === code.id}
                            title="Delete"
                            style={{ color: "#EF4444" }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
