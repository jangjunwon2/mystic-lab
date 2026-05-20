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
      setTrackingMsg("✅ Tracking saved and shipping email sent.");
    } else {
      setTrackingMsg("❌ Failed to save tracking.");
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
            Filter:
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
              {s === "all" ? `All (${orders.length})` : s}
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
                {["Order ID", "Customer", "Total", "Status", "Date", "Actions"].map((h) => (
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
                    No orders found.
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
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                        {new Date(order.created_at).toLocaleDateString()}
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
                                {s}
                              </option>
                            ))}
                          </select>
                          {order.status !== "refunded" && (
                            <button
                              onClick={() => processRefund(order.id)}
                              disabled={loadingId === order.id}
                              title="Process Refund"
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
                          <div>
                            <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Items:</p>
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
                            <p className="text-xs font-medium mb-2" style={{ color: "#9CA3AF" }}>Shipping Tracking:</p>
                            {order.tracking_number ? (
                              <p className="text-sm font-mono" style={{ color: "#F59E0B" }}>
                                {order.tracking_number}
                                {order.tracking_carrier && <span style={{ color: "#9CA3AF" }}> · {order.tracking_carrier}</span>}
                              </p>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <input
                                  placeholder="Tracking number"
                                  value={trackingInputs[order.id]?.number ?? ""}
                                  onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: { ...p[order.id], number: e.target.value, carrier: p[order.id]?.carrier ?? "" } }))}
                                  style={{ ...inputStyle, width: "180px" }}
                                />
                                <input
                                  placeholder="Carrier (optional)"
                                  value={trackingInputs[order.id]?.carrier ?? ""}
                                  onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: { ...p[order.id], carrier: e.target.value, number: p[order.id]?.number ?? "" } }))}
                                  style={{ ...inputStyle, width: "140px" }}
                                />
                                <button
                                  onClick={() => saveTracking(order.id)}
                                  disabled={!trackingInputs[order.id]?.number?.trim() || loadingId === order.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                                  style={{ background: "#3B82F622", color: "#3B82F6" }}
                                >
                                  Save & Notify
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
