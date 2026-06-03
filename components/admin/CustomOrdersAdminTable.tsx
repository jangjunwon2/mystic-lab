"use client";

import { useState } from "react";

const STATUSES = ["received", "reviewing", "quoted", "in_progress", "completed", "rejected"] as const;
type CustomStatus = (typeof STATUSES)[number];

const STATUS_COLORS: Record<CustomStatus, string> = {
  received: "#F59E0B",
  reviewing: "#3B82F6",
  quoted: "#A855F7",
  in_progress: "#10B981",
  completed: "#10B981",
  rejected: "#EF4444",
};

interface CustomOrderRequest {
  id: string;
  name: string;
  email: string;
  description: string;
  budget_range: string;
  desired_deadline: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  image_urls: string[];
}

interface Props {
  requests: CustomOrderRequest[];
}

export default function CustomOrdersAdminTable({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState<Record<string, string>>({});
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({});
  const [replySending, setReplySending] = useState<string | null>(null);
  const [replyStatus, setReplyStatus] = useState<Record<string, string>>({});

  async function updateRequest(id: string, status?: string, admin_notes?: string) {
    setLoadingId(id);
    const body: Record<string, string> = {};
    if (status) body.status = status;
    if (admin_notes !== undefined) body.admin_notes = admin_notes;

    const res = await fetch(`/api/admin/custom-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ...(status ? { status } : {}), ...(admin_notes !== undefined ? { admin_notes } : {}) }
            : r
        )
      );
    }
    setLoadingId(null);
  }

  async function sendReply(id: string) {
    const subject = replySubject[id]?.trim();
    const message = replyMessage[id]?.trim();
    if (!subject || !message) {
      setReplyStatus((prev) => ({ ...prev, [id]: "❌ 제목과 내용을 입력해주세요." }));
      return;
    }
    setReplySending(id);
    setReplyStatus((prev) => ({ ...prev, [id]: "" }));

    const res = await fetch(`/api/admin/custom-orders/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });

    setReplySending(null);
    if (res.ok) {
      setReplyStatus((prev) => ({ ...prev, [id]: "✅ 이메일 발송 완료." }));
      setReplyMessage((prev) => ({ ...prev, [id]: "" }));
    } else {
      const data = await res.json();
      setReplyStatus((prev) => ({ ...prev, [id]: `❌ ${data.error ?? "발송 실패."}` }));
    }
  }

  const inputStyle = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "6px 10px",
    fontSize: "13px",
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
              {["이름", "이메일", "예산", "희망 기한", "상태", "날짜"].map((h) => (
                <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                  커스텀 주문 의뢰가 없습니다.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <>
                  <tr
                    key={req.id}
                    className="border-b cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ borderColor: "#2D2D4E", opacity: loadingId === req.id ? 0.5 : 1 }}
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: "#F0E6FF" }}>
                      {req.name}
                    </td>
                    <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                      {req.email}
                    </td>
                    <td className="px-6 py-4" style={{ color: "#F0E6FF" }}>
                      {req.budget_range}
                    </td>
                    <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                      {req.desired_deadline ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${STATUS_COLORS[req.status as CustomStatus] ?? "#9CA3AF"}22`,
                          color: STATUS_COLORS[req.status as CustomStatus] ?? "#9CA3AF",
                        }}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>

                  {/* Expanded detail */}
                  {expandedId === req.id && (
                    <tr key={`${req.id}-detail`} style={{ background: "#13131F" }}>
                      <td colSpan={6} className="px-6 py-6 space-y-4">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>
                            의뢰 내용
                          </p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "#F0E6FF" }}>
                            {req.description}
                          </p>
                        </div>

                        {req.image_urls?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>
                              참고 이미지
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {req.image_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={url}
                                    alt={`ref ${i + 1}`}
                                    className="w-20 h-20 object-cover rounded border"
                                    style={{ borderColor: "#2D2D4E" }}
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>
                              내부 메모
                            </p>
                            <textarea
                              rows={3}
                              value={notes[req.id] ?? req.admin_notes ?? ""}
                              onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                              placeholder="내부 메모를 입력하세요..."
                              style={{ ...inputStyle, width: "100%", resize: "vertical" }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>
                                상태 변경
                              </p>
                              <select
                                value={req.status}
                                disabled={loadingId === req.id}
                                onChange={(e) => updateRequest(req.id, e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() =>
                                updateRequest(req.id, undefined, notes[req.id] ?? req.admin_notes ?? "")
                              }
                              disabled={loadingId === req.id}
                              className="w-full px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                              style={{ background: "#7C3AED", color: "#fff" }}
                            >
                              메모 저장
                            </button>
                          </div>
                        </div>

                        {/* Email Reply */}
                        <div
                          className="mt-4 pt-4 space-y-3"
                          style={{ borderTop: "1px solid #2D2D4E" }}
                        >
                          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            {req.email} 에게 회신
                          </p>
                          <input
                            type="text"
                            placeholder="제목"
                            value={replySubject[req.id] ?? ""}
                            onChange={(e) => setReplySubject((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            style={{ ...inputStyle, width: "100%" }}
                          />
                          <textarea
                            rows={4}
                            placeholder="고객에게 보낼 메시지..."
                            value={replyMessage[req.id] ?? ""}
                            onChange={(e) => setReplyMessage((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            style={{ ...inputStyle, width: "100%", resize: "vertical" }}
                          />
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => sendReply(req.id)}
                              disabled={replySending === req.id}
                              className="px-4 py-1.5 rounded text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
                            >
                              {replySending === req.id ? "발송 중…" : "이메일 발송"}
                            </button>
                            {replyStatus[req.id] && (
                              <span
                                className="text-xs"
                                style={{ color: replyStatus[req.id].startsWith("✅") ? "#10B981" : "#EF4444" }}
                              >
                                {replyStatus[req.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
