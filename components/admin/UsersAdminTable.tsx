"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShieldOff, ShieldCheck, Ban, Clock } from "lucide-react";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import PromptDialog from "@/components/admin/ui/PromptDialog";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: "rgba(16,185,129,0.12)",  color: "#10B981", label: "활성" },
  suspended: { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B", label: "정지" },
  banned:    { bg: "rgba(239,68,68,0.12)",   color: "#EF4444", label: "차단" },
  dormant:   { bg: "rgba(99,102,241,0.12)",  color: "#818CF8", label: "휴면" },
};

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  status: string;
  suspension_reason: string | null;
  created_at: string;
  phone: string | null;
  default_address: string | null;
}

interface Props {
  users: AdminUser[];
}

export default function UsersAdminTable({ users: initial }: Props) {
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const {
    confirmState, promptState,
    showConfirm, showPrompt,
    handleConfirmYes, handleConfirmNo,
    handlePromptConfirm, handlePromptCancel,
  } = useAdminDialogs();

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
    const reason = await showPrompt({
      title: "정지 사유 입력",
      message: `${user.email ?? user.display_name} 회원 정지 사유:`,
    });
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
    const header = ["ID", "Email", "Display Name", "Phone", "Address", "Role", "Status", "Joined"];
    const rows = users.map((u) => [
      u.id,
      u.email ?? "",
      u.display_name ?? "",
      u.phone ?? "",
      u.default_address ?? "",
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

  const statusCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이메일 또는 이름 검색…"
            style={{ ...inputBase, paddingLeft: "36px", width: "100%" }}
          />
        </div>
        {(["all", "active", "suspended", "banned", "dormant"] as const).map((s) => {
          const count = s === "all" ? users.length : (statusCounts[s] ?? 0);
          const style = s !== "all" ? STATUS_STYLES[s] : null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: statusFilter === s ? (style?.bg ?? "#7C3AED22") : "#1A1A2E",
                color: statusFilter === s ? (style?.color ?? "#A855F7") : "#9CA3AF",
                border: "1px solid",
                borderColor: statusFilter === s ? (style?.color ?? "#7C3AED") + "66" : "#2D2D4E",
              }}
            >
              {s === "all" ? `전체 (${count})` : `${STATUS_STYLES[s].label} (${count})`}
            </button>
          );
        })}
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
                {["이름", "이메일", "연락처", "주소", "역할", "상태", "가입일", "관리"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    회원이 없습니다.
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
                        {user.display_name ?? <span style={{ color: "#4B5563" }}>—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="transition-colors hover:underline"
                          style={{ color: "#9CA3AF" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#A855F7")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                        >
                          {user.email ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#9CA3AF", maxWidth: "120px" }}>
                        {user.phone ?? <span style={{ color: "#4B5563" }}>—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "#9CA3AF", maxWidth: "200px" }}>
                        {user.default_address
                          ? <span className="line-clamp-2 leading-relaxed">{user.default_address}</span>
                          : <span style={{ color: "#4B5563" }}>—</span>}
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
                        <div className="flex items-center gap-1.5">
                          {user.role !== "admin" && (
                            <>
                              {user.status === "active" && (
                                <>
                                  <button
                                    onClick={() => handleSuspend(user)}
                                    disabled={isLoading}
                                    title="정지"
                                    className="p-1.5 rounded transition-colors hover:opacity-80"
                                    style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
                                  >
                                    <ShieldOff className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const ok = await showConfirm({ title: "휴면 처리", message: `${user.email} 회원을 휴면 처리할까요?` });
                                      if (ok) updateStatus(user.id, "dormant");
                                    }}
                                    disabled={isLoading}
                                    title="휴면"
                                    className="p-1.5 rounded transition-colors hover:opacity-80"
                                    style={{ background: "rgba(99,102,241,0.12)", color: "#818CF8" }}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const ok = await showConfirm({ title: "영구 차단", message: `${user.email} 회원을 영구 차단할까요?`, destructive: true });
                                      if (ok) updateStatus(user.id, "banned");
                                    }}
                                    disabled={isLoading}
                                    title="영구 차단"
                                    className="p-1.5 rounded transition-colors hover:opacity-80"
                                    style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {(user.status === "suspended" || user.status === "banned" || user.status === "dormant") && (
                                <button
                                  onClick={() => { if (confirm(`${user.email ?? "이 계정"}을(를) 활성화하시겠습니까?`)) updateStatus(user.id, "active", ""); }}
                                  disabled={isLoading}
                                  title="활성화"
                                  className="p-1.5 rounded transition-colors hover:opacity-80"
                                  style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 rounded transition-colors hover:opacity-80 text-xs font-medium"
                            style={{ background: "#2D2D4E", color: "#A855F7" }}
                            title="상세 보기"
                          >
                            상세
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
      {confirmState && (
        <ConfirmDialog
          open
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          destructive={confirmState.destructive}
          onConfirm={handleConfirmYes}
          onCancel={handleConfirmNo}
        />
      )}
      {promptState && (
        <PromptDialog
          open
          title={promptState.title}
          message={promptState.message}
          placeholder={promptState.placeholder}
          confirmLabel={promptState.confirmLabel}
          cancelLabel={promptState.cancelLabel}
          destructive={promptState.destructive}
          onConfirm={handlePromptConfirm}
          onCancel={handlePromptCancel}
        />
      )}
    </div>
  );
}
