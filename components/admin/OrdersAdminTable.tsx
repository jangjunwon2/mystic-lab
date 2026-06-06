"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import TrackingInput from "./ui/TrackingInput";
import FeedbackMsg from "./ui/FeedbackMsg";
import FilterTabs from "./ui/FilterTabs";
import { INPUT_STYLE_TABLE } from "./ui/styles";

const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "refunded"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#F59E0B",
  paid: "#10B981",
  shipped: "#3B82F6",
  completed: "#10B981",
  refunded: "#EF4444",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  shipped: "배송중",
  completed: "배송완료",
  refunded: "환불됨",
};

interface OrderItem {
  id: string;
  quantity: number;
  price_usd: number;
  option_name: string | null;
  option_id: string | null;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

interface Order {
  id: string;
  customer_email: string;
  total_usd: number;
  status: string;
  created_at: string;
  shipped_at: string | null;
  completed_at: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipping_address: Record<string, string> | null;
  shipping_method: string | null;
  stripe_payment_intent_id: string | null;
  applied_discount_code: string | null;
  applied_referral_code: string | null;
  customer_note: string | null;
  points_spent?: number;
  points_earned?: number;
  order_items: OrderItem[];
}

interface Props {
  orders: Order[];
}

// 어드민(한국어) 표시용 상품명 — ko → en → slug 순.
function itemName(item: OrderItem): string {
  const tr = item.products?.product_translations;
  return (
    tr?.find((t) => t.language === "ko")?.name ??
    tr?.find((t) => t.language === "en")?.name ??
    item.products?.slug ??
    "상품"
  );
}

// 목록에 보일 구매 상품 요약 — 첫 상품 + "외 N건".
function productSummary(order: Order): string {
  const items = order.order_items;
  if (!items || items.length === 0) return "—";
  const first = items[0];
  // 애드온 라인(option_id 존재)은 상품명이 곧 옵션명이라 중복 스냅샷 생략. 레거시 옵션만 표시.
  const opt = first.option_name && !first.option_id ? ` · ${first.option_name}` : "";
  const label = `${itemName(first)}${opt} × ${first.quantity}`;
  return items.length === 1 ? label : `${label} 외 ${items.length - 1}건`;
}

function downloadOrdersCSV(orders: Order[]) {
  const header = ["Order ID", "Customer Email", "Total USD", "Status", "Items", "Date"];
  const rows = orders.map((o) => {
    const items = o.order_items
      .map((i) => {
        const name = i.products?.product_translations?.find((t) => t.language === "en")?.name ?? i.products?.slug ?? "?";
        return `${name}x${i.quantity}`;
      })
      .join(" | ");
    return [
      o.id,
      o.customer_email,
      o.total_usd.toFixed(2),
      o.status,
      `"${items}"`,
      new Date(o.created_at).toISOString().slice(0, 10),
    ];
  });

  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersAdminTable({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refundMsg, setRefundMsg] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { number: string; carrier: string }>>({});
  const [trackingMsg, setTrackingMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  function toggleSelect(orderId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === filtered.length && filtered.length > 0
        ? new Set()
        : new Set(filtered.map((o) => o.id))
    );
  }

  async function deleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`선택한 주문 ${ids.length}건을 영구 삭제합니다. 되돌릴 수 없습니다. 계속할까요?`)) return;
    setBulkDeleting(true);
    setRefundMsg(null);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/orders/${id}`, { method: "DELETE" }).then((r) => ({ id, ok: r.ok }))
      )
    );
    const deletedIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
    const failCount = results.length - deletedIds.size;
    setOrders((prev) => prev.filter((o) => !deletedIds.has(o.id)));
    setSelected(new Set());
    setBulkDeleting(false);
    setRefundMsg(
      failCount > 0
        ? `❌ ${deletedIds.size}건 삭제, ${failCount}건 실패`
        : `🗑️ 주문 ${deletedIds.size}건 삭제 완료`
    );
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setLoadingId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
    setLoadingId(null);
  }

  async function processRefund(orderId: string) {
    setLoadingId(orderId);
    setRefundMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: refundReason || "고객 요청" }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "refunded" } : o));
      setRefundMsg(data.message ?? "환불 처리 완료");
    } else {
      setRefundMsg(`❌ ${data.error ?? "환불 실패"}`);
    }
    setLoadingId(null);
    setRefundingId(null);
    setRefundReason("");
  }

  async function saveTracking(orderId: string) {
    const t = trackingInputs[orderId];
    if (!t?.number?.trim()) return;
    setLoadingId(orderId);
    setTrackingMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_number: t.number.trim(), tracking_carrier: t.carrier.trim() || null }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) =>
        o.id === orderId
          ? { ...o, tracking_number: t.number.trim(), tracking_carrier: t.carrier.trim() || null, status: "shipped" }
          : o
      ));
      setTrackingMsg("✅ 운송장 저장 완료, 배송 이메일 발송됨.");
    } else {
      setTrackingMsg("❌ 운송장 저장 실패.");
    }
    setLoadingId(null);
  }


  return (
    <div className="space-y-4">
      <FeedbackMsg msg={trackingMsg} />
      <FeedbackMsg msg={refundMsg} />
      {/* Filter + CSV Export */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>필터:</span>
          <FilterTabs
            tabs={[
              { key: "all", label: `전체 (${orders.length})` },
              ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] })),
            ]}
            active={filter}
            onChange={setFilter}
          />
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={bulkDeleting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "#EF444422", border: "1px solid #EF444444", color: "#EF4444" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkDeleting ? "삭제 중…" : `선택 삭제 (${selected.size})`}
            </button>
          )}
          <button
            onClick={() => downloadOrdersCSV(orders)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 flex items-center gap-1.5"
            style={{ background: "#1A1A2E", border: "1px solid #2D2D4E", color: "#9CA3AF" }}
          >
            ↓ CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    className="w-4 h-4 cursor-pointer"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                {["상품", "고객", "합계", "상태", "날짜", "관리"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="border-b cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderColor: "#2D2D4E", opacity: loadingId === order.id ? 0.5 : 1 }}
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="주문 선택"
                          className="w-4 h-4 cursor-pointer"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                        />
                      </td>
                      <td className="px-6 py-4" style={{ color: "#F0E6FF" }}>
                        {productSummary(order)}
                      </td>
                      <td className="px-6 py-4" style={{ color: "#F0E6FF" }}>
                        {order.customer_email}
                      </td>
                      <td className="px-6 py-4 font-medium" style={{ color: "#A855F7" }}>
                        ${order.total_usd.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: `${STATUS_COLORS[order.status as OrderStatus] ?? "#9CA3AF"}22`,
                            color: STATUS_COLORS[order.status as OrderStatus] ?? "#9CA3AF",
                          }}
                        >
                          {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
                        <div>
                          <span style={{ color: "#6B7280" }}>주문 </span>
                          {new Date(order.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                        {order.shipped_at && (
                          <div>
                            <span style={{ color: "#3B82F6" }}>발송 </span>
                            {new Date(order.shipped_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                          </div>
                        )}
                        {order.completed_at && (
                          <div>
                            <span style={{ color: "#10B981" }}>완료 </span>
                            {new Date(order.completed_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            disabled={loadingId === order.id}
                            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                            style={{ ...INPUT_STYLE_TABLE, cursor: "pointer" }}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          {order.status !== "refunded" && refundingId !== order.id && (
                            <button
                              onClick={() => { setRefundingId(order.id); setExpandedId(order.id); }}
                              disabled={loadingId === order.id}
                              title="환불 처리"
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
                              style={{ background: "#EF444422", color: "#EF4444" }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`} style={{ background: "#13131F" }}>
                        <td colSpan={7} className="px-6 py-4 space-y-4">

                          {/* Order ID */}
                          <div>
                            <span className="text-xs" style={{ color: "#6B7280" }}>주문 ID: </span>
                            <span className="text-xs font-mono" style={{ color: "#9CA3AF" }}>{order.id}</span>
                          </div>

                          {/* Gateway + shipping method */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {order.stripe_payment_intent_id && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: order.stripe_payment_intent_id.startsWith("toss_") ? "#3B82F622" : "#84CC1622",
                                  color: order.stripe_payment_intent_id.startsWith("toss_") ? "#3B82F6" : "#84CC16",
                                  border: `1px solid ${order.stripe_payment_intent_id.startsWith("toss_") ? "#3B82F644" : "#84CC1644"}`,
                                }}>
                                {order.stripe_payment_intent_id.startsWith("toss_") ? "Toss" : "Lemon"}
                              </span>
                            )}
                            {order.shipping_method && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C3AED22] text-[#A855F7] border border-[#7C3AED44]">
                                {order.shipping_method === "express" ? "특송 (DHL·FedEx)" : "일반배송 (EMS)"}
                              </span>
                            )}
                          </div>

                          {/* Shipping address */}
                          {order.shipping_address && (
                            <div>
                              <p className="text-xs font-medium mb-1.5" style={{ color: "#9CA3AF" }}>배송지:</p>
                              <div className="text-xs space-y-0.5" style={{ color: "#F0E6FF" }}>
                                {order.shipping_address.name && <p>{order.shipping_address.name} {order.shipping_address.phone && `· ${order.shipping_address.phone}`}</p>}
                                {order.shipping_address.line1 && <p>{order.shipping_address.line1} {order.shipping_address.line2}</p>}
                                {order.shipping_address.city && <p>{order.shipping_address.city} {order.shipping_address.postal} {order.shipping_address.country}</p>}
                                {order.shipping_address.address && <p>{order.shipping_address.address}</p>}
                                {order.shipping_address.detail && <p>{order.shipping_address.detail}</p>}
                              </div>
                            </div>
                          )}

                          {/* Refund inline form */}
                          {refundingId === order.id && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                              <p className="text-sm font-semibold text-red-400">환불 처리</p>
                              <input
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="환불 사유 (예: 고객 요청, 상품 불량)"
                                style={{ ...INPUT_STYLE_TABLE, width: "100%" }}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => processRefund(order.id)}
                                  disabled={loadingId === order.id}
                                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                                  style={{ background: "#EF4444", color: "#fff" }}
                                >
                                  {loadingId === order.id ? "처리 중..." : "환불 확정"}
                                </button>
                                <button
                                  onClick={() => { setRefundingId(null); setRefundReason(""); }}
                                  className="px-4 py-1.5 rounded-lg text-xs text-[#9CA3AF] border border-[#2D2D4E] hover:opacity-80 transition-opacity"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>주문 상품:</p>
                            <div className="space-y-1">
                              {order.order_items.map((item) => {
                                const name =
                                  item.products?.product_translations?.find(
                                    (t) => t.language === "en"
                                  )?.name ?? item.products?.slug ?? "Unknown";
                                return (
                                  <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                    style={{ color: "#F0E6FF" }}
                                  >
                                    <span>
                                      {name}
                                      {item.option_name && !item.option_id && <span style={{ color: "#A855F7" }}> · {item.option_name}</span>}
                                      {" "}× {item.quantity}
                                    </span>
                                    <span style={{ color: "#A855F7" }}>
                                      ${(item.price_usd * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 결제·할인 정보 */}
                          {(() => {
                            const subtotal = order.order_items.reduce((s, it) => s + it.price_usd * it.quantity, 0);
                            const spent = order.points_spent ?? 0;
                            const earned = order.points_earned ?? 0;
                            return (
                              <div>
                                <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>결제·할인:</p>
                                <div className="text-xs space-y-1" style={{ color: "#9CA3AF" }}>
                                  <div className="flex justify-between">
                                    <span>상품 합계</span>
                                    <span style={{ color: "#F0E6FF" }}>${subtotal.toFixed(2)}</span>
                                  </div>
                                  {order.applied_discount_code && (
                                    <div className="flex justify-between">
                                      <span>할인 코드</span>
                                      <span style={{ color: "#10B981" }}>{order.applied_discount_code}</span>
                                    </div>
                                  )}
                                  {order.applied_referral_code && (
                                    <div className="flex justify-between">
                                      <span>레퍼럴 코드</span>
                                      <span style={{ color: "#10B981" }}>{order.applied_referral_code}</span>
                                    </div>
                                  )}
                                  {spent > 0 && (
                                    <div className="flex justify-between">
                                      <span>마일리지 사용</span>
                                      <span style={{ color: "#EF4444" }}>-{spent.toLocaleString()}P (-${(spent / 100).toFixed(2)})</span>
                                    </div>
                                  )}
                                  {earned > 0 && (
                                    <div className="flex justify-between">
                                      <span>마일리지 적립</span>
                                      <span style={{ color: "#A855F7" }}>+{earned.toLocaleString()}P</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-1 mt-1 border-t border-[#2D2D4E] font-semibold">
                                    <span style={{ color: "#9CA3AF" }}>실 결제액</span>
                                    <span style={{ color: "#A855F7" }}>${order.total_usd.toFixed(2)}</span>
                                  </div>
                                  {order.customer_note && (
                                    <div className="pt-1 mt-1 border-t border-[#2D2D4E]">
                                      <span>메모: </span>
                                      <span style={{ color: "#F0E6FF" }}>{order.customer_note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Tracking */}
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>배송 추적:</p>
                            {order.tracking_number ? (
                              <p className="text-sm font-mono" style={{ color: "#F59E0B" }}>
                                {order.tracking_number}
                                {order.tracking_carrier && <span style={{ color: "#9CA3AF" }}> · {order.tracking_carrier}</span>}
                              </p>
                            ) : (
                              <TrackingInput
                                number={trackingInputs[order.id]?.number ?? ""}
                                carrier={trackingInputs[order.id]?.carrier ?? ""}
                                saving={loadingId === order.id}
                                btnLabel="저장 & 발송 알림"
                                onNumberChange={(v) => setTrackingInputs((p) => ({ ...p, [order.id]: { ...p[order.id], number: v, carrier: p[order.id]?.carrier ?? "" } }))}
                                onCarrierChange={(v) => setTrackingInputs((p) => ({ ...p, [order.id]: { ...p[order.id], carrier: v, number: p[order.id]?.number ?? "" } }))}
                                onSave={() => saveTracking(order.id)}
                              />
                            )}
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
    </div>
  );
}
