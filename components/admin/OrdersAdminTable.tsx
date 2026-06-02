"use client";

import { useState } from "react";
import { RotateCcw, Truck, ChevronDown, ChevronUp } from "lucide-react";

const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "refunded"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   "결제 대기",
  paid:      "결제 완료",
  shipped:   "배송중",
  completed: "배송 완료",
  refunded:  "환불",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   "#F59E0B",
  paid:      "#3B82F6",
  shipped:   "#818CF8",
  completed: "#10B981",
  refunded:  "#EF4444",
};

const CARRIERS = [
  { value: "cj",     label: "CJ대한통운" },
  { value: "hanjin", label: "한진택배" },
  { value: "lotte",  label: "롯데택배" },
  { value: "epost",  label: "우체국택배" },
  { value: "logen",  label: "로젠택배" },
  { value: "dhl",    label: "DHL" },
  { value: "fedex",  label: "FedEx" },
  { value: "ups",    label: "UPS" },
  { value: "ems",    label: "EMS (국제우편)" },
];

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
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipping_method: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address: any;
  order_items: OrderItem[];
}

interface Props {
  orders: Order[];
}

export default function OrdersAdminTable({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refundMsg, setRefundMsg] = useState<string | null>(null);
  // 운송장 입력 상태 { orderId: { tracking_number, tracking_carrier } }
  const [trackingEdits, setTrackingEdits] = useState<Record<string, { tracking_number: string; tracking_carrier: string }>>({});
  const [trackingSaving, setTrackingSaving] = useState<string | null>(null);

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

  async function saveTracking(order: Order) {
    const edit = trackingEdits[order.id];
    if (!edit) return;
    setTrackingSaving(order.id);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracking_number: edit.tracking_number,
        tracking_carrier: edit.tracking_carrier,
        // 운송장 입력 시 자동으로 배송중 상태로 전환
        ...(order.status === "paid" ? { status: "shipped" } : {}),
      }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                tracking_number: edit.tracking_number,
                tracking_carrier: edit.tracking_carrier,
                status: o.status === "paid" ? "shipped" : o.status,
              }
            : o
        )
      );
      setTrackingEdits((prev) => { const n = { ...prev }; delete n[order.id]; return n; });
    }
    setTrackingSaving(null);
  }

  async function processRefund(orderId: string) {
    const reason = window.prompt("환불 사유를 입력하세요:", "고객 요청");
    if (reason === null) return;
    setLoadingId(orderId);
    setRefundMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "refunded" } : o));
      setRefundMsg(data.message ?? "환불 처리 완료");
    } else {
      setRefundMsg(`❌ ${data.error ?? "환불 실패"}`);
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

  const filterCounts: Record<string, number> = { all: orders.length };
  for (const s of ORDER_STATUSES) {
    filterCounts[s] = orders.filter((o) => o.status === s).length;
  }

  return (
    <div className="space-y-4">
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

      {/* 필터 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ key: "all", label: "전체" }, ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: filter === key ? "#7C3AED" : "#1A1A2E",
              color: filter === key ? "#fff" : "#9CA3AF",
              border: "1px solid",
              borderColor: filter === key ? "#7C3AED" : "#2D2D4E",
            }}
          >
            {label} ({filterCounts[key] ?? 0})
          </button>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["주문번호", "이메일", "금액", "상태", "주문일시", "관리"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    주문 없음
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const isLoading = loadingId === order.id;
                  const trackEdit = trackingEdits[order.id];

                  return (
                    <>
                      <tr
                        key={order.id}
                        className="border-b cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ borderColor: "#2D2D4E", opacity: isLoading ? 0.5 : 1 }}
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      >
                        <td className="px-5 py-4 font-mono text-xs" style={{ color: "#9CA3AF" }}>
                          {order.id.slice(0, 8).toUpperCase()}…
                          {isExpanded ? <ChevronUp className="inline ml-1 w-3 h-3" /> : <ChevronDown className="inline ml-1 w-3 h-3" />}
                        </td>
                        <td className="px-5 py-4 max-w-[180px] truncate" style={{ color: "#F0E6FF" }}>
                          {order.customer_email}
                        </td>
                        <td className="px-5 py-4 font-semibold" style={{ color: "#A855F7" }}>
                          ${order.total_usd.toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: `${STATUS_COLORS[order.status as OrderStatus] ?? "#9CA3AF"}22`,
                              color: STATUS_COLORS[order.status as OrderStatus] ?? "#9CA3AF",
                            }}
                          >
                            {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                          </span>
                          {order.status === "shipped" && order.tracking_number && (
                            <div className="mt-1 text-[10px] font-mono" style={{ color: "#818CF8" }}>
                              <Truck className="inline w-2.5 h-2.5 mr-0.5" />
                              {order.tracking_number}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: "#9CA3AF" }}>
                          {new Date(order.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {/* 상태 변경 드롭다운 */}
                            <select
                              value={order.status}
                              disabled={isLoading}
                              onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                              style={{ ...inputStyle, cursor: "pointer", minWidth: "100px" }}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                            {/* 환불 버튼 */}
                            {order.status !== "refunded" && (
                              <button
                                onClick={() => processRefund(order.id)}
                                disabled={isLoading}
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

                      {/* 펼침 상세 */}
                      {isExpanded && (
                        <tr key={`${order.id}-detail`} style={{ background: "#13131F" }}>
                          <td colSpan={6} className="px-5 py-4 space-y-4">

                            {/* 운송장 입력 섹션 */}
                            {order.status !== "refunded" && (
                              <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#9CA3AF" }}>
                                  <Truck className="w-3.5 h-3.5" /> 배송 추적 정보
                                </p>
                                <div className="flex flex-wrap items-end gap-2">
                                  {/* 배송사 */}
                                  <div>
                                    <label className="block text-[10px] mb-1" style={{ color: "#6B7280" }}>배송사</label>
                                    <select
                                      value={trackEdit?.tracking_carrier ?? order.tracking_carrier ?? ""}
                                      onChange={(e) =>
                                        setTrackingEdits((p) => ({
                                          ...p,
                                          [order.id]: { tracking_number: p[order.id]?.tracking_number ?? order.tracking_number ?? "", tracking_carrier: e.target.value },
                                        }))
                                      }
                                      style={{ ...inputStyle, minWidth: "130px" }}
                                    >
                                      <option value="">배송사 선택</option>
                                      {CARRIERS.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {/* 운송장 번호 */}
                                  <div>
                                    <label className="block text-[10px] mb-1" style={{ color: "#6B7280" }}>운송장 번호</label>
                                    <input
                                      type="text"
                                      placeholder="운송장 번호 입력"
                                      value={trackEdit?.tracking_number ?? order.tracking_number ?? ""}
                                      onChange={(e) =>
                                        setTrackingEdits((p) => ({
                                          ...p,
                                          [order.id]: { tracking_carrier: p[order.id]?.tracking_carrier ?? order.tracking_carrier ?? "", tracking_number: e.target.value },
                                        }))
                                      }
                                      style={{ ...inputStyle, minWidth: "180px" }}
                                    />
                                  </div>
                                  {/* 저장 */}
                                  <button
                                    onClick={() => saveTracking(order)}
                                    disabled={trackingSaving === order.id || !trackEdit}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                                    style={{ background: "#7C3AED", color: "#fff" }}
                                  >
                                    {trackingSaving === order.id ? "저장 중..." : "운송장 저장"}
                                  </button>
                                  {order.status === "paid" && trackEdit && (
                                    <span className="text-[10px]" style={{ color: "#F59E0B" }}>
                                      저장 시 상태가 '배송중'으로 자동 변경됩니다
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 배송지 */}
                            {order.shipping_address && (
                              <div>
                                <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>배송지</p>
                                <p className="text-xs" style={{ color: "#6B7280" }}>
                                  {[
                                    order.shipping_address.name,
                                    order.shipping_address.phone,
                                    order.shipping_address.line1,
                                    order.shipping_address.line2,
                                    order.shipping_address.city,
                                    order.shipping_address.postal,
                                    order.shipping_address.country,
                                  ].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            )}

                            {/* 상품 목록 */}
                            <div>
                              <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>주문 상품</p>
                              <div className="space-y-1">
                                {order.order_items.map((item) => {
                                  const name =
                                    item.products?.product_translations?.find((t) => t.language === "ko")?.name ??
                                    item.products?.product_translations?.find((t) => t.language === "en")?.name ??
                                    item.products?.slug ?? "알 수 없음";
                                  return (
                                    <div key={item.id} className="flex justify-between text-xs" style={{ color: "#F0E6FF" }}>
                                      <span>{name} × {item.quantity}</span>
                                      <span style={{ color: "#A855F7" }}>${(item.price_usd * item.quantity).toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </td>
                        </tr>
                      )}
                    </>
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
