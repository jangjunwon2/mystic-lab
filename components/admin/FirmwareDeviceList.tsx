"use client";

import { useState } from "react";
import { Trash2, Download, Copy, Check, RefreshCw } from "lucide-react";

interface FirmwareRelease {
  id: string;
  device_type: string;
  version: string;
  download_url: string;
  storage_path: string;
  file_size: number | null;
  notes: string | null;
  created_at: string;
}

interface FirmwareDeviceListProps {
  releases: FirmwareRelease[];
  setReleases: React.Dispatch<React.SetStateAction<FirmwareRelease[]>>;
  polling: boolean;
  newReleaseAlert: string | null;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export default function FirmwareDeviceList({ releases, setReleases, polling, newReleaseAlert }: FirmwareDeviceListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteRelease(id: string, version: string) {
    if (!confirm(`버전 ${version}을 삭제할까요? 파일도 함께 삭제됩니다.`)) return;
    setDeleteError(null);
    const res = await fetch(`/api/admin/firmware/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReleases((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      setDeleteError(`삭제 실패 (v${version}) — 잠시 후 다시 시도해주세요.`);
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}개 릴리스를 삭제할까요? 파일도 함께 삭제됩니다.`)) return;
    setBulkDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/admin/firmware", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setReleases((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    } else {
      setDeleteError(`일괄 삭제 실패 — 잠시 후 다시 시도해주세요.`);
    }
    setBulkDeleting(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === releases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(releases.map((r) => r.id)));
    }
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
      {deleteError && (
        <div
          className="px-6 py-3 text-xs font-medium"
          style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}
        >
          {deleteError}
        </div>
      )}
      {newReleaseAlert && (
        <div
          className="px-6 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: "rgba(16,185,129,0.12)", borderBottom: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}
        >
          <Check className="w-4 h-4 shrink-0" />
          {newReleaseAlert}
        </div>
      )}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #2D2D4E" }}>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>
            릴리스 이력 ({releases.length})
          </h2>
          {polling && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#9CA3AF" }}>
              <RefreshCw className="w-3 h-3 animate-spin" />
              빌드 완료 대기 중…
            </span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {bulkDeleting ? "삭제 중…" : `선택 삭제 (${selectedIds.size})`}
          </button>
        )}
      </div>


      {releases.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm" style={{ color: "#6B7280" }}>
          업로드된 펌웨어가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === releases.length && releases.length > 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                    style={{ accentColor: "#7C3AED" }}
                  />
                </th>
                {["장치 타입", "버전", "파일 크기", "날짜", "다운로드 URL", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {releases.map((rel) => (
                <tr
                  key={rel.id}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid #2D2D4E",
                    background: selectedIds.has(rel.id) ? "rgba(124,58,237,0.06)" : "transparent",
                  }}
                >
                  <td className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rel.id)}
                      onChange={() => toggleSelect(rel.id)}
                      className="cursor-pointer"
                      style={{ accentColor: "#7C3AED" }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7" }}>
                      {rel.device_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#F0E6FF" }}>
                    {rel.version}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                    {rel.file_size ? formatBytes(rel.file_size) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                    {new Date(rel.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    {rel.download_url ? (
                      <div className="flex items-center gap-2">
                        <a href={rel.download_url} download className="flex items-center gap-1 text-xs" style={{ color: "#7C3AED" }}>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => copyUrl(rel.download_url, rel.id)}
                          className="text-xs"
                          style={{ color: copiedId === rel.id ? "#10B981" : "#6B7280" }}
                          title="URL 복사"
                        >
                          {copiedId === rel.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <span className="max-w-[180px] truncate text-xs" style={{ color: "#4B5563" }}>
                          {rel.download_url}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "#6B7280" }}>빌드 대기 중…</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteRelease(rel.id, rel.version)}
                      className="p-1 transition-colors"
                      style={{ color: "#6B7280" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
