"use client";

import { useState } from "react";

interface ShippingAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postal?: string;
  country?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_usd: number;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

interface ShippingOrder {
  id: string;
  customer_email: string;
  status: string;
  created_at: string;
  shipping_method: string | null;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  order_items: OrderItem[];
}

interface Props {
  orders: ShippingOrder[];
}

type FilterTab = "all" | "paid" | "shipped" | "completed";

function getShippingMethodBadge(method: string | null) {
  if (!method) return { label: "국내배송", color: "#10B981", bg: "#10B98122" };
  if (method === "standard") return { label: "Standard (EMS)", color: "#3B82F6", bg: "#3B82F622" };
  if (method === "express") return { label: "Express (DHL/FedEx)", color: "#F59E0B", bg: "#F59E0B22" };
  return { label: method, color: "#9CA3AF", bg: "#9CA3AF22" };
}

function formatShippingAddress(addr: ShippingAddress | null): string {
  if (!addr) return "—";
  const parts: string[] = [];
  if (addr.name) parts.push(addr.name);
  if (addr.phone) parts.push(addr.phone);
  const street = [addr.line1, addr.line2].filter(Boolean).join(" ");
  if (street) parts.push(street);
  const last = [addr.postal, addr.city, addr.country].filter(Boolean).join(" ");
  if (last) parts.push(last);
  return parts.join(" / ") || "—";
}

const inputStyle = {
  background: "#0D0D1A",
  border: "1px solid #2D2D4E",
  borderRadius: "8px",
  color: "#F0E6FF",
  padding: "6px 10px",
  fontSize: "13px",
};

export default function ShippingAdminTable({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { number: string; carrier: string }>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // 통계는 현재 주문 상태(클라이언트 state)에서 파생 → 발송 처리 시 즉시 갱신
  const stats = {
    pending: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  async function saveTracking(orderId: string) {
    const t = trackingInputs[orderId];
    if (!t?.number?.trim()) return;
    setLoadingId(orderId);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "shipped",
        tracking_number: t.number.trim(),
        tracking_carrier: t.carrier.trim() || null,
      }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "shipped", tracking_number: t.number.trim(), tracking_carrier: t.carrier.trim() || null }
            : o
        )
      );
      setMsg("✅ 운송장 저장 완료, 배송 알림 이메일 발송됨.");
    } else {
      setMsg("❌ 운송장 저장 실패.");
    }
    setLoadingId(null);
  }

  const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: "all", label: `전체 (${orders.length})` },
    { value: "paid", label: `발송 대기 (${stats.pending})` },
    { value: "shipped", label: `발송 중 (${stats.shipped})` },
    { value: "completed", label: `배송 완료 (${stats.completed})` },
  ];

  const STATUS_LABELS: Record<string, string> = {
    paid: "결제완료",
    shipped: "배송중",
    completed: "배송완료",
  };

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    paid: { color: "#F59E0B", bg: "#F59E0B22" },
    shipped: { color: "#3B82F6", bg: "#3B82F622" },
    completed: { color: "#10B981", bg: "#10B98122" },
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>미발송</p>
          <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{stats.pending}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>발송 중</p>
          <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{stats.shipped}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>배송 완료</p>
          <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{stats.completed}</p>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: msg.startsWith("❌") ? "#EF444422" : "#10B98122",
            color: msg.startsWith("❌") ? "#EF4444" : "#10B981",
            border: "1px solid",
            borderColor: msg.startsWith("❌") ? "#EF444444" : "#10B98144",
          }}
        >
          {msg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: filter === tab.value ? "#7C3AED" : "#1A1A2E",
              color: filter === tab.value ? "#fff" : "#9CA3AF",
              border: "1px solid",
              borderColor: filter === tab.value ? "#7C3AED" : "#2D2D4E",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#13131F", borderBottom: "1px solid #2D2D4E" }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>주문번호</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>주문일</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>고객</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>배송 방법</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>배송지</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>운송장</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>상태</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: "#9CA3AF" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>
                    해당하는 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const badge = getShippingMethodBadge(order.shipping_method);
                  const statusStyle = STATUS_COLORS[order.status] ?? { color: "#9CA3AF", bg: "#9CA3AF22" };
                  const trackingInput = trackingInputs[order.id];

                  return (
                    <tr
                      key={order.id}
                      style={{ borderBottom: "1px solid #2D2D4E", background: "#1A1A2E" }}
                    >
                      {/* 주문번호 */}
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "#A855F7" }}>
                        #{order.id.slice(0, 8)}
                      </td>

                      {/* 주문일 */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                        {new Date(order.created_at).toLocaleDateString("ko-KR")}
                      </td>

                      {/* 고객 */}
                      <td className="px-4 py-3 text-xs" style={{ color: "#F0E6FF" }}>
                        {order.customer_email}
                      </td>

                      {/* 배송 방법 */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* 배송지 */}
                      <td className="px-4 py-3 text-xs max-w-[200px]" style={{ color: "#9CA3AF" }}>
                        <span title={formatShippingAddress(order.shipping_address)}>
                          {formatShippingAddress(order.shipping_address).length > 40
                            ? formatShippingAddress(order.shipping_address).slice(0, 40) + "…"
                            : formatShippingAddress(order.shipping_address)}
                        </span>
                      </td>

                      {/* 운송장 */}
                      <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                        {order.tracking_number ? (
                          <div>
                            <span style={{ color: "#F0E6FF" }}>{order.tracking_number}</span>
                            {order.tracking_carrier && (
                              <span className="ml-1 text-xs" style={{ color: "#9CA3AF" }}>
                                ({order.tracking_carrier})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#6B7280" }}>미입력</span>
                        )}
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>

                      {/* 액션 — 운송장 입력 (paid 상태만) */}
                      <td className="px-4 py-3">
                        {order.status === "paid" ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              placeholder="운송장 번호"
                              value={trackingInput?.number ?? ""}
                              onChange={(e) =>
                                setTrackingInputs((p) => ({
                                  ...p,
                                  [order.id]: { carrier: p[order.id]?.carrier ?? "", number: e.target.value },
                                }))
                              }
                              style={{ ...inputStyle, width: "160px" }}
                            />
                            <select
                              value={trackingInput?.carrier ?? ""}
                              onChange={(e) =>
                                setTrackingInputs((p) => ({
                                  ...p,
                                  [order.id]: { number: p[order.id]?.number ?? "", carrier: e.target.value },
                                }))
                              }
                              style={{ ...inputStyle, width: "140px", cursor: "pointer" }}
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
                              disabled={!trackingInput?.number?.trim() || loadingId === order.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                              style={{ background: "#3B82F622", color: "#3B82F6" }}
                            >
                              {loadingId === order.id ? "저장 중…" : "발송 처리"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "#6B7280" }}>—</span>
                        )}
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
