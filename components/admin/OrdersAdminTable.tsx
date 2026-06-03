"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

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
  order_items: OrderItem[];
}

interface Props {
  orders: Order[];
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

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

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


  const inputStyle = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "6px 10px",
    fontSize: "13px",
  };

  return (
    <div className="space-y-4">
      {trackingMsg && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: trackingMsg.startsWith("❌") ? "#EF444422" : "#10B98122",
            color: trackingMsg.startsWith("❌") ? "#EF4444" : "#10B981",
            border: "1px solid",
            borderColor: trackingMsg.startsWith("❌") ? "#EF444444" : "#10B98144",
          }}
        >
          {trackingMsg}
        </div>
      )}
      {refundMsg && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: refundMsg.startsWith("❌") ? "#EF444422" : "#10B98122",
            color: refundMsg.startsWith("❌") ? "#EF4444" : "#10B981",
            border: "1px solid",
            borderColor: refundMsg.startsWith("❌") ? "#EF444444" : "#10B98144",
          }}
        >
          {refundMsg}
        </div>
      )}
      {/* Filter + CSV Export */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>
            필터:
          </span>
          {["all", ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                background: filter === s ? "#7C3AED" : "#1A1A2E",
                color: filter === s ? "#fff" : "#9CA3AF",
                border: "1px solid",
                borderColor: filter === s ? "#7C3AED" : "#2D2D4E",
              }}
            >
              {s === "all" ? `전체 (${orders.length})` : STATUS_LABELS[s as OrderStatus]}
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadOrdersCSV(orders)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 flex items-center gap-1.5"
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
                {["주문 ID", "고객", "합계", "상태", "날짜", "관리"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
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
                      <td className="px-6 py-4 font-mono text-xs" style={{ color: "#9CA3AF" }}>
                        {order.id.slice(0, 8)}…
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
                            style={{ ...inputStyle, cursor: "pointer" }}
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
                        <td colSpan={6} className="px-6 py-4 space-y-4">

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
                                style={{ ...inputStyle, width: "100%" }}
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
                                    <span>{name} × {item.quantity}</span>
                                    <span style={{ color: "#A855F7" }}>
                                      ${(item.price_usd * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Tracking */}
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>배송 추적:</p>
                            {order.tracking_number ? (
                              <p className="text-sm font-mono" style={{ color: "#F59E0B" }}>
                                {order.tracking_number}
                                {order.tracking_carrier && <span style={{ color: "#9CA3AF" }}> · {order.tracking_carrier}</span>}
                              </p>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  placeholder="운송장 번호"
                                  value={trackingInputs[order.id]?.number ?? ""}
                                  onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: { ...p[order.id], number: e.target.value, carrier: p[order.id]?.carrier ?? "" } }))}
                                  style={{ ...inputStyle, width: "180px" }}
                                />
                                <select
                                  value={trackingInputs[order.id]?.carrier ?? ""}
                                  onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: { ...p[order.id], carrier: e.target.value, number: p[order.id]?.number ?? "" } }))}
                                  style={{ ...inputStyle, width: "150px", cursor: "pointer" }}
                                >
                                  <option value="">배송사 선택</option>
                                  <optgroup label="국내">
                                    <option>CJ대한통운</option>
                                    <option>한진택배</option>
                                    <option>롯데택배</option>
                                    <option>우체국</option>
                                    <option>로젠</option>
                                  </optgroup>
                                  <optgroup label="국제">
                                    <option>DHL</option>
                                    <option>FedEx</option>
                                    <option>UPS</option>
                                    <option>EMS</option>
                                    <option>우체국EMS</option>
                                  </optgroup>
                                </select>
                                <button
                                  onClick={() => saveTracking(order.id)}
                                  disabled={!trackingInputs[order.id]?.number?.trim() || loadingId === order.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                                  style={{ background: "#3B82F622", color: "#3B82F6" }}
                                >
                                  저장 & 발송 알림
                                </button>
                              </div>
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
