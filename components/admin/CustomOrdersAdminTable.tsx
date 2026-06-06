"use client";

import { useState, useEffect, useCallback } from "react";

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
  quoted_price_usd: number | null;
  quoted_price_krw: number | null;
  payment_token: string | null;
  payment_status: string | null;
}

interface ThreadMessage {
  id: string;
  sender: "admin" | "customer";
  message: string;
  created_at: string;
}

interface Props {
  requests: CustomOrderRequest[];
}

export default function CustomOrdersAdminTable({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [quoteUsd, setQuoteUsd] = useState<Record<string, string>>({});
  const [quoteKrw, setQuoteKrw] = useState<Record<string, string>>({});
  const [quoteSending, setQuoteSending] = useState<string | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<Record<string, string>>({});
  const [payLinks, setPayLinks] = useState<Record<string, string>>({});

  // Thread state
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [threadLoaded, setThreadLoaded] = useState<Record<string, boolean>>({});
  const [threadLoading, setThreadLoading] = useState<string | null>(null);
  const [threadNewMsg, setThreadNewMsg] = useState<Record<string, string>>({});
  const [threadSending, setThreadSending] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<Record<string, string>>({});

  const loadThread = useCallback(async (id: string) => {
    if (threadLoaded[id]) return;
    setThreadLoading(id);
    try {
      const res = await fetch(`/api/admin/custom-orders/${id}/messages`);
      if (res.ok) {
        const data: ThreadMessage[] = await res.json();
        setThreadMessages((prev) => ({ ...prev, [id]: data }));
      }
    } finally {
      setThreadLoading(null);
      setThreadLoaded((prev) => ({ ...prev, [id]: true }));
    }
  }, [threadLoaded]);

  useEffect(() => {
    if (expandedId) loadThread(expandedId);
  }, [expandedId, loadThread]);

  async function sendThreadMessage(id: string) {
    const msg = threadNewMsg[id]?.trim();
    if (!msg) return;
    setThreadSending(id);
    setThreadError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/custom-orders/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        const newMsg: ThreadMessage = await res.json();
        setThreadMessages((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), newMsg] }));
        setThreadNewMsg((prev) => ({ ...prev, [id]: "" }));
      } else {
        const data = await res.json().catch(() => ({}));
        setThreadError((prev) => ({ ...prev, [id]: data.error ?? `오류 (${res.status})` }));
      }
    } catch {
      setThreadError((prev) => ({ ...prev, [id]: "네트워크 오류가 발생했습니다." }));
    }
    setThreadSending(null);
  }

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

  async function sendQuote(id: string) {
    const usd = parseFloat(quoteUsd[id] ?? "");
    if (!usd || usd <= 0) {
      setQuoteStatus((prev) => ({ ...prev, [id]: "❌ USD 금액을 입력해주세요." }));
      return;
    }
    setQuoteSending(id);
    setQuoteStatus((prev) => ({ ...prev, [id]: "" }));
    const body: Record<string, unknown> = { quoted_price_usd: usd };
    const krw = parseInt(quoteKrw[id] ?? "", 10);
    if (krw > 0) body.quoted_price_krw = krw;

    const res = await fetch(`/api/admin/custom-orders/${id}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setQuoteSending(null);
    if (res.ok) {
      const data = await res.json();
      setPayLinks((prev) => ({ ...prev, [id]: data.paymentLink }));
      setQuoteStatus((prev) => ({ ...prev, [id]: "✅ 견적 발송 완료." }));
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "quoted", quoted_price_usd: usd, quoted_price_krw: krw > 0 ? krw : null }
            : r
        )
      );
    } else {
      const data = await res.json();
      setQuoteStatus((prev) => ({ ...prev, [id]: `❌ ${data.error ?? "실패."}` }));
    }
  }

  async function deleteRequest(id: string) {
    if (!window.confirm("이 의뢰를 영구 삭제할까요? 되돌릴 수 없습니다.")) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/custom-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
    setLoadingId(null);
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

                        {/* Quote & Payment Link */}
                        <div
                          className="mt-4 pt-4 space-y-3"
                          style={{ borderTop: "1px solid #2D2D4E" }}
                        >
                          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A855F7" }}>
                            결제 견적 발송
                          </p>
                          {/* existing quoted price */}
                          {req.quoted_price_usd && (
                            <div className="flex items-center gap-3 text-xs" style={{ color: "#9CA3AF" }}>
                              <span>
                                현재 견적: <span style={{ color: "#F59E0B" }}>${req.quoted_price_usd}</span>
                                {req.quoted_price_krw && (
                                  <span> / ₩{req.quoted_price_krw.toLocaleString()}</span>
                                )}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: req.payment_status === "paid" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                                  color: req.payment_status === "paid" ? "#10B981" : "#F59E0B",
                                }}
                              >
                                {req.payment_status === "paid" ? "결제완료" : "미결제"}
                              </span>
                            </div>
                          )}
                          {/* payment link display */}
                          {(payLinks[req.id] || (req.payment_token && req.payment_status !== "paid")) && (
                            <div className="flex items-center gap-2">
                              <input
                                readOnly
                                value={payLinks[req.id] ?? `${typeof window !== "undefined" ? window.location.origin : ""}/en/custom-order/pay/${req.payment_token}`}
                                className="flex-1 text-xs rounded-lg px-3 py-2"
                                style={{ ...inputStyle, color: "#A855F7" }}
                              />
                              <button
                                onClick={() => {
                                  const url = payLinks[req.id] ?? `/en/custom-order/pay/${req.payment_token}`;
                                  navigator.clipboard.writeText(
                                    url.startsWith("http") ? url : `${window.location.origin}${url}`
                                  );
                                }}
                                className="px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                                style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.3)", whiteSpace: "nowrap" }}
                              >
                                복사
                              </button>
                            </div>
                          )}
                          <div className="flex items-end gap-3">
                            <div>
                              <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>USD 금액</p>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="예: 150.00"
                                value={quoteUsd[req.id] ?? (req.quoted_price_usd ? String(req.quoted_price_usd) : "")}
                                onChange={(e) => setQuoteUsd((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                style={{ ...inputStyle, width: "120px" }}
                              />
                            </div>
                            <div>
                              <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>KRW (선택)</p>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="예: 200000"
                                value={quoteKrw[req.id] ?? (req.quoted_price_krw ? String(req.quoted_price_krw) : "")}
                                onChange={(e) => setQuoteKrw((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                style={{ ...inputStyle, width: "140px" }}
                              />
                            </div>
                            <button
                              onClick={() => sendQuote(req.id)}
                              disabled={quoteSending === req.id}
                              className="px-4 py-1.5 rounded text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
                            >
                              {quoteSending === req.id ? "발송 중…" : "견적 발송"}
                            </button>
                          </div>
                          {quoteStatus[req.id] && (
                            <span
                              className="text-xs"
                              style={{ color: quoteStatus[req.id].startsWith("✅") ? "#10B981" : "#EF4444" }}
                            >
                              {quoteStatus[req.id]}
                            </span>
                          )}
                        </div>

                        {/* Message Thread */}
                        <div
                          className="mt-4 pt-4 space-y-3"
                          style={{ borderTop: "1px solid #2D2D4E" }}
                        >
                          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                            대화 스레드
                          </p>

                          {threadLoading === req.id ? (
                            <div className="flex justify-center py-4">
                              <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "#7C3AED" }} />
                            </div>
                          ) : (threadMessages[req.id] ?? []).length === 0 ? (
                            <p className="text-xs text-center py-3 rounded-xl" style={{ color: "#6B7280", background: "rgba(156,163,175,0.04)", border: "1px solid rgba(156,163,175,0.1)" }}>
                              아직 메시지가 없습니다.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {(threadMessages[req.id] ?? []).map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                  <div
                                    className="max-w-[80%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                                    style={
                                      msg.sender === "admin"
                                        ? { background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.35)", color: "#F0E6FF", borderRadius: "16px 4px 16px 16px" }
                                        : { background: "rgba(30,30,60,0.6)", border: "1px solid #2D2D4E", color: "#D1D5DB", borderRadius: "4px 16px 16px 16px" }
                                    }
                                  >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[10px] font-semibold" style={{ color: msg.sender === "admin" ? "#A855F7" : "#9CA3AF" }}>
                                        {msg.sender === "admin" ? "관리자" : req.name}
                                      </span>
                                      <span className="text-[10px]" style={{ color: "#4B5563" }}>
                                        {new Date(msg.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    {msg.message}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 메시지 입력 */}
                          <div className="flex gap-2 items-end">
                            <textarea
                              rows={3}
                              placeholder="고객에게 보낼 메시지... (이메일 알림도 발송됩니다)"
                              value={threadNewMsg[req.id] ?? ""}
                              onChange={(e) => { setThreadNewMsg((prev) => ({ ...prev, [req.id]: e.target.value })); setThreadError((prev) => ({ ...prev, [req.id]: "" })); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendThreadMessage(req.id); }
                              }}
                              style={{ ...inputStyle, flex: 1, resize: "vertical" }}
                            />
                            <button
                              onClick={() => sendThreadMessage(req.id)}
                              disabled={threadSending === req.id || !threadNewMsg[req.id]?.trim()}
                              className="px-4 py-2 rounded text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 shrink-0"
                              style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
                            >
                              {threadSending === req.id ? "전송 중…" : "전송"}
                            </button>
                          </div>
                          {threadError[req.id] && (
                            <p className="text-xs" style={{ color: "#EF4444" }}>{threadError[req.id]}</p>
                          )}
                          <p className="text-[10px]" style={{ color: "#4B5563" }}>전송 시 고객({req.email})에게 이메일 알림이 발송됩니다.</p>
                        </div>

                        {/* 의뢰 삭제 */}
                        <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: "1px solid #2D2D4E" }}>
                          <button
                            onClick={() => deleteRequest(req.id)}
                            disabled={loadingId === req.id}
                            className="px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                          >
                            의뢰 삭제
                          </button>
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
