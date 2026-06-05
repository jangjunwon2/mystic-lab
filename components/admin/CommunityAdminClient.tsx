"use client";

import { useState } from "react";
import { Trash2, Pin, MessageSquare } from "lucide-react";
import type { AdminCommunityPost } from "@/lib/community-admin";

const TYPE_LABEL: Record<string, string> = { suggestion: "개선 제안", staging: "연출 공유", update: "공지" };
const TYPE_COLOR: Record<string, string> = { suggestion: "#3B82F6", staging: "#A855F7", update: "#F59E0B" };

export default function CommunityAdminClient({ initialPosts }: { initialPosts: AdminCommunityPost[] }) {
  const [posts, setPosts] = useState<AdminCommunityPost[]>(initialPosts);
  const [filter, setFilter] = useState<"all" | "suggestion" | "staging" | "update">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(kind: "post" | "comment", id: string) {
    if (!confirm(kind === "post" ? "이 글을 삭제할까요? (댓글도 함께 삭제됩니다)" : "이 댓글을 삭제할까요?")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/community", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    if (res.ok) {
      if (kind === "post") setPosts((prev) => prev.filter((p) => p.id !== id));
      else setPosts((prev) => prev.map((p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) })));
    }
    setBusyId(null);
  }

  const fmt = (iso: string) => { try { return new Date(iso).toLocaleDateString("ko"); } catch { return iso.slice(0, 10); } };
  const shown = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(["all", "suggestion", "staging", "update"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "#7C3AED" : "#1A1A2E",
              color: filter === f ? "#fff" : "#9CA3AF",
              border: "1px solid #2D2D4E",
            }}>
            {f === "all" ? "전체" : TYPE_LABEL[f]}
          </button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: "#6B7280" }}>{shown.length}건</span>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: "#9CA3AF" }}>글이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <div key={p.id} className="rounded-xl border p-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: `${TYPE_COLOR[p.type]}22`, color: TYPE_COLOR[p.type] }}>
                      {TYPE_LABEL[p.type] ?? p.type}
                    </span>
                    {p.isPinned && <Pin className="w-3 h-3" style={{ color: "#A855F7" }} />}
                    <span className="text-xs" style={{ color: "#A855F7" }}>{p.productName}</span>
                  </div>
                  {p.title && <p className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>{p.title}</p>}
                  <p className="text-sm whitespace-pre-wrap break-words" style={{ color: "#F0E6FF" }}>{p.body}</p>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{p.authorName} · {fmt(p.createdAt)}</p>
                </div>
                <button onClick={() => remove("post", p.id)} disabled={busyId === p.id} className="shrink-0 p-1.5 rounded hover:opacity-80" style={{ color: "#EF4444" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {p.comments.length > 0 && (
                <div className="mt-3 pl-3 space-y-1.5" style={{ borderLeft: "1px solid #2D2D4E" }}>
                  {p.comments.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-2">
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>
                        <MessageSquare className="inline w-3 h-3 mr-1" style={{ color: "#6B7280" }} />
                        <span style={{ color: "#A855F7" }}>{c.authorName}</span> {c.body}
                      </p>
                      <button onClick={() => remove("comment", c.id)} disabled={busyId === c.id} className="shrink-0 p-0.5 rounded hover:opacity-80" style={{ color: "#EF4444" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
