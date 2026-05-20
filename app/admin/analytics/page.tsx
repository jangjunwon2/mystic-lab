import { createAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "Analytics — Admin" };

interface OrderRow {
  total_usd: number;
  status: string;
  created_at: string;
  customer_email: string;
}

interface OrderItemRow {
  quantity: number;
  price_usd: number;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

function getDailyRevenue(orders: OrderRow[], days = 30) {
  const map: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    const key = o.created_at.slice(0, 10);
    if (key in map) map[key] += o.total_usd;
  }
  return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const W = 640;
  const H = 160;
  const pad = { top: 12, right: 8, bottom: 24, left: 48 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const barW = Math.max(1, chartW / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "200px" }}>
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((frac) => {
        const y = pad.top + chartH * (1 - frac);
        const val = maxRev * frac;
        return (
          <g key={frac}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#2D2D4E" strokeWidth={1} />
            <text x={pad.left - 4} y={y + 4} fill="#6B7280" fontSize={9} textAnchor="end">
              ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.left + i * (chartW / data.length) + 1;
        const barH = (d.revenue / maxRev) * chartH;
        const y = pad.top + chartH - barH;
        const isWeekend = new Date(d.date).getDay() % 6 === 0;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={d.revenue > 0 ? (isWeekend ? "#A855F7" : "#7C3AED") : "#1A1A2E"}
            />
            {/* X label — show only every 5 days */}
            {i % 5 === 0 && (
              <text
                x={x + barW / 2}
                y={H - 4}
                fill="#6B7280"
                fontSize={8}
                textAnchor="middle"
              >
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "#1A1A2E",
        borderColor: highlight ? "#A855F7" : "#2D2D4E",
      }}
    >
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: highlight ? "#A855F7" : "#F0E6FF" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  paid: "#10B981",
  shipped: "#3B82F6",
  completed: "#10B981",
  refunded: "#EF4444",
};

export default async function AdminAnalyticsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [ordersRes, orderItemsRes, profilesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_usd, status, created_at, customer_email")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("quantity, price_usd, products(slug, product_translations(name, language))")
      .limit(500),
    supabase.from("profiles").select("id, created_at", { count: "exact" }),
  ]);

  const allOrders: OrderRow[] = ordersRes.data ?? [];
  const orderItems: OrderItemRow[] = orderItemsRes.data ?? [];

  // Split orders: last 30 days vs prev 30 days
  const now = new Date();
  const recentOrders = allOrders.filter(
    (o) => new Date(o.created_at) >= thirtyDaysAgo && new Date(o.created_at) <= now
  );
  const prevOrders = allOrders.filter(
    (o) => new Date(o.created_at) >= sixtyDaysAgo && new Date(o.created_at) < thirtyDaysAgo
  );

  const recentRevenue = recentOrders
    .filter((o) => ["paid", "shipped", "completed"].includes(o.status))
    .reduce((s, o) => s + o.total_usd, 0);

  const prevRevenue = prevOrders
    .filter((o) => ["paid", "shipped", "completed"].includes(o.status))
    .reduce((s, o) => s + o.total_usd, 0);

  const revChangePct =
    prevRevenue === 0
      ? null
      : Math.round(((recentRevenue - prevRevenue) / prevRevenue) * 100);

  const recentOrderCount = recentOrders.filter((o) =>
    ["paid", "shipped", "completed"].includes(o.status)
  ).length;

  const avgOrderValue = recentOrderCount > 0 ? recentRevenue / recentOrderCount : 0;

  // Daily revenue chart data
  const dailyData = getDailyRevenue(recentOrders, 30);

  // Order status breakdown
  const statusMap: Record<string, number> = {};
  for (const o of allOrders) {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  }

  // Product revenue ranking
  const productMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const item of orderItems) {
    const slug = item.products?.slug ?? "unknown";
    const name =
      item.products?.product_translations?.find((t) => t.language === "en")?.name ?? slug;
    if (!productMap[slug]) productMap[slug] = { name, revenue: 0, count: 0 };
    productMap[slug].revenue += item.price_usd * item.quantity;
    productMap[slug].count += item.quantity;
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // New members this month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newMembersThisMonth = ((profilesRes.data ?? []) as { created_at: string }[]).filter(
    (p) => new Date(p.created_at) >= thisMonthStart
  ).length;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
        Analytics
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue (30d)"
          value={`$${recentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={
            revChangePct !== null
              ? `${revChangePct > 0 ? "+" : ""}${revChangePct}% vs prev 30d`
              : "No prior data"
          }
          highlight
        />
        <StatCard
          label="Orders (30d)"
          value={String(recentOrderCount)}
          sub={`${prevOrders.filter((o) => ["paid","shipped","completed"].includes(o.status)).length} prev period`}
        />
        <StatCard
          label="Avg Order"
          value={`$${avgOrderValue.toFixed(0)}`}
          sub="Last 30 days"
        />
        <StatCard
          label="New Members"
          value={String(newMembersThisMonth)}
          sub="This calendar month"
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
          Daily Revenue — Last 30 Days
        </h2>
        <RevenueChart data={dailyData} />
        <p className="text-xs mt-2" style={{ color: "#4B5563" }}>
          Weekends shown in lighter purple · paid / shipped / completed orders only
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
            Top Products by Revenue
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No order data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => {
                const maxRev = topProducts[0].revenue || 1;
                return (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "#F0E6FF" }}>
                        <span style={{ color: "#9CA3AF" }} className="mr-2">#{idx + 1}</span>
                        {p.name}
                      </span>
                      <span style={{ color: "#A855F7" }}>
                        ${p.revenue.toFixed(0)}
                        <span className="ml-2 text-xs" style={{ color: "#9CA3AF" }}>
                          ({p.count} sold)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#2D2D4E" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(p.revenue / maxRev) * 100}%`,
                          background: "linear-gradient(90deg, #7C3AED, #A855F7)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
            Orders by Status (All Time)
          </h2>
          <div className="space-y-2">
            {Object.entries(statusMap)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const total = Object.values(statusMap).reduce((s, n) => s + n, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const color = STATUS_COLORS[status] ?? "#9CA3AF";
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "#F0E6FF" }}>{status}</span>
                      <span style={{ color }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#2D2D4E" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(statusMap).length === 0 && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>No orders yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Note on conversion tracking */}
      <div
        className="rounded-xl border p-5 text-sm"
        style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#9CA3AF" }}
      >
        <p className="font-medium mb-1" style={{ color: "#F0E6FF" }}>Conversion Rate Tracking</p>
        <p>
          Product page views → cart adds → purchase funnel data is available in{" "}
          <strong style={{ color: "#A855F7" }}>Vercel Analytics</strong> and{" "}
          <strong style={{ color: "#A855F7" }}>Google Analytics 4</strong>.
          Set up GA4 purchase events in <code>.env.local</code> with{" "}
          <code>NEXT_PUBLIC_GA_ID</code> to track the full conversion funnel.
        </p>
      </div>
    </div>
  );
}
