"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldOff, ShieldCheck, Ban, Plus, Trash2, Package, Play, Mail } from "lucide-react";

interface Product { id: string; slug: string; product_translations: { name: string; language: string }[] }
interface Grant { id: string; note: string | null; expires_at: string | null; created_at: string; products: Product | null }
interface OrderItem { id: string; quantity: number; price_usd: number; products: Product | null }
interface Order { id: string; status: string; total_usd: number; created_at: string; order_items: OrderItem[] }
interface Profile { id: string; display_name: string | null; role: string; status: string; suspension_reason: string | null; created_at: string }

interface Props {
  profile: Profile;
  email: string | null;
  orders: Order[];
  grants: Grant[];
  allProducts: { id: string; slug: string; name: string }[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
  suspended: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  banned:    { bg: "rgba(239,68,68,0.12)",  color: "#EF4444" },
};

export default function UserDetailClient({ profile: initialProfile, email, orders, grants: initialGrants, allProducts }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [grants, setGrants] = useState(initialGrants);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantProductId, setGrantProductId] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [grantExpiry, setGrantExpiry] = useState("");
  const [savingGrant, setSavingGrant] = useState(false);
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

  async function handleSuspend() {
    const reason = window.prompt("Suspension reason:");
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
    if (!window.confirm("Revoke this video access?")) return;
    const res = await fetch(`/api/admin/users/${profile.id}/grants?grant_id=${grantId}`, { method: "DELETE" });
    if (res.ok) setGrants((prev) => prev.filter((g) => g.id !== grantId));
  }

  async function sendEmail() {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailStatus("❌ Subject and message required.");
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
      setEmailStatus("✅ Email sent.");
      setEmailSubject("");
      setEmailMessage("");
    } else {
      const data = await res.json();
      setEmailStatus(`❌ ${data.error ?? "Failed to send."}`);
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
              {profile.display_name ?? "No name"}
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>{email ?? "—"}</p>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              Joined {new Date(profile.created_at).toLocaleDateString()} · Role: {profile.role}
            </p>
            {profile.suspension_reason && (
              <p className="text-xs mt-1" style={{ color: "#F59E0B" }}>
                Reason: {profile.suspension_reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
              {profile.status}
            </span>
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
                      <ShieldOff className="w-3.5 h-3.5" /> Suspend
                    </button>
                    <button
                      onClick={() => { if (window.confirm("Ban this user?")) updateStatus("banned"); }}
                      disabled={loadingStatus}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                    >
                      <Ban className="w-3.5 h-3.5" /> Ban
                    </button>
                  </>
                )}
                {(profile.status === "suspended" || profile.status === "banned") && (
                  <button
                    onClick={() => updateStatus("active", "")}
                    disabled={loadingStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Restore
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
            <Play className="w-4 h-4 text-[#A855F7]" /> Manual Video Access
          </h3>
          <button
            onClick={() => setShowGrantForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid rgba(124,58,237,0.4)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Grant Access
          </button>
        </div>

        {showGrantForm && (
          <div className="mb-4 p-4 rounded-lg space-y-3" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Product</label>
              <select
                value={grantProductId}
                onChange={(e) => setGrantProductId(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              >
                <option value="">— Select product —</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Note (optional)</label>
              <input
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="e.g. CS compensation, reviewer access"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] mb-1 block">Expires at (optional, leave blank = permanent)</label>
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
                {savingGrant ? "Saving…" : "Save Grant"}
              </button>
              <button
                onClick={() => setShowGrantForm(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#2D2D4E", color: "#9CA3AF" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {grants.length === 0 ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>No manual grants.</p>
        ) : (
          <div className="space-y-2">
            {grants.map((g) => {
              const name = g.products?.product_translations.find((t) => t.language === "en")?.name
                ?? g.products?.slug ?? "Unknown product";
              const expired = g.expires_at && new Date(g.expires_at) < new Date();
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                  style={{ background: "#13131F" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: expired ? "#6B7280" : "#F0E6FF" }}>
                      {name} {expired && <span style={{ color: "#EF4444" }}>(expired)</span>}
                    </p>
                    {g.note && <p className="text-xs" style={{ color: "#9CA3AF" }}>{g.note}</p>}
                    <p className="text-xs" style={{ color: "#6B7280" }}>
                      {g.expires_at
                        ? `Expires ${new Date(g.expires_at).toLocaleDateString()}`
                        : "Permanent"
                      } · Granted {new Date(g.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeGrant(g.id)}
                    className="p-1.5 rounded transition-colors hover:opacity-80"
                    style={{ color: "#EF4444" }}
                    title="Revoke"
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
          <Package className="w-4 h-4 text-[#A855F7]" /> Orders ({orders.length})
        </h3>
        {orders.length === 0 ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>No orders.</p>
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

      {/* Send email */}
      {email && (
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "#F0E6FF" }}>
            <Mail className="w-4 h-4 text-[#A855F7]" /> Send Email to {email}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
            />
            <textarea
              rows={4}
              placeholder="Your message..."
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
                {sendingEmail ? "Sending…" : "Send Email"}
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
        ← Back to Users
      </Link>
    </div>
  );
}
