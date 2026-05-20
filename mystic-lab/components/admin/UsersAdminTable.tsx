"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShieldOff, ShieldCheck, Ban, ChevronRight } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)", color: "#10B981", label: "Active" },
  suspended: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", label: "Suspended" },
  banned:    { bg: "rgba(239,68,68,0.12)",  color: "#EF4444", label: "Banned" },
};

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  status: string;
  suspension_reason: string | null;
  created_at: string;
}

interface Props {
  users: AdminUser[];
}

export default function UsersAdminTable({ users: initial }: Props) {
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchQ =
      !query ||
      u.email?.toLowerCase().includes(query.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(query.toLowerCase());
    const matchS = statusFilter === "all" || u.status === statusFilter;
    return matchQ && matchS;
  });

  async function updateStatus(userId: string, status: string, reason?: string) {
    setLoadingId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, suspension_reason: reason ?? null }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status, suspension_reason: reason ?? null } : u
        )
      );
    }
    setLoadingId(null);
  }

  async function handleSuspend(user: AdminUser) {
    const reason = window.prompt(`Suspension reason for ${user.email ?? user.display_name}:`);
    if (reason === null) return;
    await updateStatus(user.id, "suspended", reason);
  }

  const inputBase: React.CSSProperties = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "6px 10px",
    fontSize: "13px",
  };

  function downloadUsersCSV() {
    const header = ["ID", "Email", "Display Name", "Role", "Status", "Joined"];
    const rows = users.map((u) => [
      u.id,
      u.email ?? "",
      u.display_name ?? "",
      u.role,
      u.status,
      new Date(u.created_at).toISOString().slice(0, 10),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name…"
            style={{ ...inputBase, paddingLeft: "36px", width: "100%" }}
          />
        </div>
        {["all", "active", "suspended", "banned"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: statusFilter === s ? "#7C3AED" : "#1A1A2E",
              color: statusFilter === s ? "#fff" : "#9CA3AF",
              border: "1px solid",
              borderColor: statusFilter === s ? "#7C3AED" : "#2D2D4E",
            }}
          >
            {s === "all" ? `All (${users.length})` : s}
          </button>
        ))}
        <button
          onClick={downloadUsersCSV}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "#1A1A2E", border: "1px solid #2D2D4E", color: "#9CA3AF" }}
        >
          ↓ CSV
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const st = STATUS_STYLES[user.status] ?? STATUS_STYLES.active;
                  const isLoading = loadingId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="border-b transition-opacity"
                      style={{ borderColor: "#2D2D4E", opacity: isLoading ? 0.5 : 1 }}
                    >
                      <td className="px-5 py-3.5 font-medium" style={{ color: "#F0E6FF" }}>
                        {user.display_name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "#9CA3AF" }}>
                        {user.email ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={
                            user.role === "admin"
                              ? { background: "rgba(245,158,11,0.15)", color: "#F59E0B" }
                              : { background: "#2D2D4E", color: "#9CA3AF" }
                          }
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                          {user.suspension_reason && (
                            <p className="text-xs mt-0.5 max-w-[160px] truncate" style={{ color: "#6B7280" }}>
                              {user.suspension_reason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#6B7280" }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {/* Status actions */}
                          {user.status === "active" && user.role !== "admin" && (
                            <>
                              <button
                                onClick={() => handleSuspend(user)}
                                disabled={isLoading}
                                title="Suspend"
                                className="p-1.5 rounded transition-colors hover:opacity-80"
                                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Ban ${user.email}? They will lose all access.`)) {
                                    updateStatus(user.id, "banned");
                                  }
                                }}
                                disabled={isLoading}
                                title="Ban"
                                className="p-1.5 rounded transition-colors hover:opacity-80"
                                style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {(user.status === "suspended" || user.status === "banned") && (
                            <button
                              onClick={() => updateStatus(user.id, "active", "")}
                              disabled={isLoading}
                              title="Restore"
                              className="p-1.5 rounded transition-colors hover:opacity-80"
                              style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Detail link */}
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 rounded transition-colors hover:opacity-80"
                            style={{ background: "#2D2D4E", color: "#A855F7" }}
                            title="View detail"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
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
