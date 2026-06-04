import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

interface RecentOrderItem {
  quantity: number;
  option_name: string | null;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

interface OrderRow {
  id: string;
  total_usd: number;
  status: string;
  customer_email: string;
  created_at: string;
}

interface RecentOrderRow extends OrderRow {
  applied_discount_code: string | null;
  order_items: RecentOrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "결제대기",
  paid: "결제완료",
  shipped: "배송중",
  completed: "배송완료",
  refunded: "환불됨",
};

function itemSummary(items: RecentOrderItem[]): string {
  if (!items?.length) return "—";
  return items
    .map((i) => {
      const name =
        i.products?.product_translations?.find((t) => t.language === "ko")?.name ??
        i.products?.product_translations?.find((t) => t.language === "en")?.name ??
        i.products?.slug ?? "상품";
      const opt = i.option_name ? ` (${i.option_name})` : "";
      return `${name}${opt}×${i.quantity}`;
    })
    .join(", ");
}

async function getStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [ordersRes, productsRes, customOrdersRes, recentOrdersRes] = await Promise.all([
    supabase.from("orders").select("id, total_usd, status", { count: "exact" }),
    supabase.from("products").select("id", { count: "exact" }),
    supabase
      .from("custom_order_requests")
      .select("id", { count: "exact" })
      .eq("status", "received"),
    supabase
      .from("orders")
      .select("id, customer_email, total_usd, status, created_at, applied_discount_code, order_items(quantity, option_name, products(slug, product_translations(name, language)))")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const orders: OrderRow[] = ordersRes.data ?? [];
  const paidRevenue = orders
    .filter((o) => ["paid", "shipped", "completed"].includes(o.status))
    .reduce((sum, o) => sum + o.total_usd, 0);

  return {
    totalOrders: ordersRes.count ?? 0,
    totalRevenue: paidRevenue,
    totalProducts: productsRes.count ?? 0,
    pendingCustomOrders: customOrdersRes.count ?? 0,
    recentOrders: (recentOrdersRes.data ?? []) as RecentOrderRow[],
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  paid: "#10B981",
  shipped: "#3B82F6",
  completed: "#10B981",
  refunded: "#EF4444",
};

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        대시보드
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "총 주문", value: stats.totalOrders },
          { label: "총 매출", value: `$${stats.totalRevenue.toFixed(2)}` },
          { label: "상품 수", value: stats.totalProducts },
          { label: "대기 중인 커스텀 주문", value: stats.pendingCustomOrders, highlight: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-6 border"
            style={{
              background: "#1A1A2E",
              borderColor: stat.highlight && stats.pendingCustomOrders > 0 ? "#F59E0B" : "#2D2D4E",
            }}
          >
            <p className="text-sm mb-2" style={{ color: "#9CA3AF" }}>
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: stat.highlight && stats.pendingCustomOrders > 0 ? "#F59E0B" : "#A855F7" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/admin/products/new"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          + 새 상품
        </Link>
        <Link
          href="/admin/orders"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "#1A1A2E", color: "#A855F7", border: "1px solid #2D2D4E" }}
        >
          주문 전체 보기
        </Link>
        {stats.pendingCustomOrders > 0 && (
          <Link
            href="/admin/custom-orders"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "#1A1A2E", color: "#F59E0B", border: "1px solid #F59E0B" }}
          >
            커스텀 주문 {stats.pendingCustomOrders}건 대기 중
          </Link>
        )}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#2D2D4E" }}>
          <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>
            최근 주문
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["주문 ID", "고객", "상품", "합계", "상태", "날짜"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 font-medium"
                    style={{ color: "#9CA3AF" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center" style={{ color: "#9CA3AF" }}>
                    아직 주문이 없습니다.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:opacity-80 transition-opacity"
                    style={{ borderColor: "#2D2D4E" }}
                  >
                    <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-4" style={{ color: "#F0E6FF" }}>
                      {order.customer_email}
                    </td>
                    <td className="px-6 py-4 max-w-[260px]" style={{ color: "#9CA3AF" }}>
                      <span className="line-clamp-2 text-xs">{itemSummary(order.order_items)}</span>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap" style={{ color: "#A855F7" }}>
                      ${order.total_usd.toFixed(2)}
                      {order.applied_discount_code && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full align-middle" style={{ background: "#10B98122", color: "#10B981" }}>
                          {order.applied_discount_code}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{
                          background: `${STATUS_COLORS[order.status] ?? "#9CA3AF"}22`,
                          color: STATUS_COLORS[order.status] ?? "#9CA3AF",
                        }}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                      {new Date(order.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
