import { createAdminClient } from "@/lib/supabase/server";
import AnalyticsExportButton from "@/components/admin/AnalyticsExportButton";

export const metadata = { title: "Analytics — Admin" };

interface OrderRow {
  total_usd: number;
  status: string;
  created_at: string;
  customer_email: string;
}

function getLtv(orders: OrderRow[]) {
  const map: Record<string, { email: string; total: number; count: number }> = {};
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    const e = o.customer_email;
    if (!map[e]) map[e] = { email: e, total: 0, count: 0 };
    map[e].total += o.total_usd;
    map[e].count += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
}

function getBuyerSegments(orders: OrderRow[]) {
  const map: Record<string, number> = {};
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    map[o.customer_email] = (map[o.customer_email] ?? 0) + 1;
  }
  const values = Object.values(map);
  return {
    newBuyers: values.filter((n) => n === 1).length,
    returning: values.filter((n) => n > 1).length,
  };
}

interface OrderItemRow {
  product_id: string | null;
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

  const [ordersRes, orderItemsRes, profilesRes, allOrdersRes,
    productsRes, viewsRes, wishlistsRes, sharesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_usd, status, created_at, customer_email")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("product_id, quantity, price_usd, products(slug, product_translations(name, language))")
      .limit(2000),
    supabase.from("profiles").select("id, created_at", { count: "exact" }),
    supabase
      .from("orders")
      .select("total_usd, status, customer_email, user_id, stripe_payment_intent_id, shipping_address")
      .limit(2000),
    // 상품 마스터 (상품별 상세 통계 행 구성)
    supabase.from("products").select("id, slug, product_translations(name, language)").eq("is_active", true),
    // 상품 조회수 (최근 30일)
    supabase.from("product_views").select("product_id").gte("viewed_at", thirtyDaysAgo.toISOString()).limit(20000),
    // 위시리스트 (전체)
    supabase.from("wishlists").select("user_id, product_id").limit(20000),
    // 공유 이벤트 (최근 30일)
    supabase.from("share_events").select("product_id, channel").gte("created_at", thirtyDaysAgo.toISOString()).limit(20000),
  ]);

  const allOrders: OrderRow[] = ordersRes.data ?? [];
  const orderItems: OrderItemRow[] = orderItemsRes.data ?? [];
  const allTimeOrders: OrderRow[] = (allOrdersRes.data ?? []).map((o: { total_usd: number; status: string; customer_email: string }) => ({
    ...o,
    created_at: "",
  }));
  const topCustomers = getLtv(allTimeOrders);
  const buyerSegments = getBuyerSegments(allTimeOrders);

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

  // ───── 마케팅 지표 (신규) ─────
  const pickName = (translations: { name: string; language: string }[] | undefined, slug: string) =>
    translations?.find((t) => t.language === "ko")?.name ??
    translations?.find((t) => t.language === "en")?.name ?? slug;

  const productList = ((productsRes.data ?? []) as { id: string; slug: string; product_translations: { name: string; language: string }[] }[])
    .map((p) => ({ id: p.id, name: pickName(p.product_translations, p.slug) }));

  const views = (viewsRes.data ?? []) as { product_id: string }[];
  const wishlists = (wishlistsRes.data ?? []) as { user_id: string; product_id: string }[];
  const shares = (sharesRes.data ?? []) as { product_id: string | null; channel: string }[];
  const allOrdersFull = (allOrdersRes.data ?? []) as { status: string; user_id: string | null }[];
  const PAID = ["paid", "shipped", "completed"];

  const totalViews = views.length; // 최근 30일 상품 조회수 (24h 쿠키 중복방지 후)

  // 결제 전환율: 결제완료+ / (결제완료+ + 결제대기)
  const paidOrdersCount = allOrdersFull.filter((o) => PAID.includes(o.status)).length;
  const pendingOrdersCount = allOrdersFull.filter((o) => o.status === "pending").length;
  const paymentConversion = paidOrdersCount + pendingOrdersCount > 0
    ? Math.round((paidOrdersCount / (paidOrdersCount + pendingOrdersCount)) * 100)
    : null;

  // 위시리스트 → 구매 전환율: 위시한 회원 중 실제 구매(결제완료+)한 회원 비율
  const wishlistUserIds = new Set(wishlists.map((w) => w.user_id));
  const buyerUserIds = new Set(allOrdersFull.filter((o) => PAID.includes(o.status) && o.user_id).map((o) => o.user_id));
  const wishlistBuyers = [...wishlistUserIds].filter((id) => buyerUserIds.has(id)).length;
  const wishlistConversion = wishlistUserIds.size > 0
    ? Math.round((wishlistBuyers / wishlistUserIds.size) * 100)
    : null;

  // 상품별 상세 통계 (조회/위시/판매/매출/공유)
  const countByProduct = (rows: { product_id: string | null }[]) => {
    const m: Record<string, number> = {};
    for (const r of rows) if (r.product_id) m[r.product_id] = (m[r.product_id] ?? 0) + 1;
    return m;
  };
  const viewsByProduct = countByProduct(views);
  const wishByProduct = countByProduct(wishlists);
  const sharesByProduct = countByProduct(shares);
  const salesByProduct: Record<string, { qty: number; revenue: number }> = {};
  for (const it of orderItems) {
    if (!it.product_id) continue;
    if (!salesByProduct[it.product_id]) salesByProduct[it.product_id] = { qty: 0, revenue: 0 };
    salesByProduct[it.product_id].qty += it.quantity;
    salesByProduct[it.product_id].revenue += it.price_usd * it.quantity;
  }
  const productStats = productList.map((p) => ({
    name: p.name,
    views: viewsByProduct[p.id] ?? 0,
    wishes: wishByProduct[p.id] ?? 0,
    sales: salesByProduct[p.id]?.qty ?? 0,
    revenue: salesByProduct[p.id]?.revenue ?? 0,
    shares: sharesByProduct[p.id] ?? 0,
    cvr: (viewsByProduct[p.id] ?? 0) > 0 ? Math.round(((salesByProduct[p.id]?.qty ?? 0) / (viewsByProduct[p.id] ?? 1)) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  // 공유 채널별 집계
  const shareByChannel: Record<string, number> = {};
  for (const s of shares) shareByChannel[s.channel] = (shareByChannel[s.channel] ?? 0) + 1;
  const totalShares = shares.length;
  const SHARE_LABELS: Record<string, string> = {
    native: "공유시트", facebook: "Facebook", x: "X", whatsapp: "WhatsApp", telegram: "Telegram", line: "LINE", copy: "링크복사",
  };

  // ───── 결제수단·국가별 분포 (결제완료+ 기준) ─────
  interface FullOrder { total_usd: number; status: string; stripe_payment_intent_id: string | null; shipping_address: Record<string, string> | null }
  const fullOrders = (allOrdersRes.data ?? []) as FullOrder[];

  const gatewayStats: Record<string, { count: number; revenue: number }> = {};
  for (const o of fullOrders) {
    if (!PAID.includes(o.status)) continue;
    const ref = o.stripe_payment_intent_id ?? "";
    const gw = ref.startsWith("toss_") ? "Toss (한국)" : ref.startsWith("lemon_") ? "LemonSqueezy (해외)" : "수동/기타";
    if (!gatewayStats[gw]) gatewayStats[gw] = { count: 0, revenue: 0 };
    gatewayStats[gw].count += 1;
    gatewayStats[gw].revenue += o.total_usd;
  }
  const gatewayEntries = Object.entries(gatewayStats).sort(([, a], [, b]) => b.revenue - a.revenue);
  const gatewayTotal = gatewayEntries.reduce((s, [, v]) => s + v.revenue, 0) || 1;

  const countryStats: Record<string, { count: number; revenue: number }> = {};
  for (const o of fullOrders) {
    if (!PAID.includes(o.status)) continue;
    const country = (o.shipping_address?.country ?? "").toUpperCase().trim() || "미지정";
    if (!countryStats[country]) countryStats[country] = { count: 0, revenue: 0 };
    countryStats[country].count += 1;
    countryStats[country].revenue += o.total_usd;
  }
  const countryEntries = Object.entries(countryStats).sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, 10);
  const countryTotal = countryEntries.reduce((s, [, v]) => s + v.revenue, 0) || 1;

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          통계
        </h1>
        <AnalyticsExportButton />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="매출 (30일)"
          value={`$${recentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={
            revChangePct !== null
              ? `${revChangePct > 0 ? "+" : ""}${revChangePct}% 전월 대비`
              : "이전 데이터 없음"
          }
          highlight
        />
        <StatCard
          label="주문 (30일)"
          value={String(recentOrderCount)}
          sub={`전월 ${prevOrders.filter((o) => ["paid","shipped","completed"].includes(o.status)).length}건`}
        />
        <StatCard
          label="평균 주문금액"
          value={`$${avgOrderValue.toFixed(0)}`}
          sub="최근 30일"
        />
        <StatCard
          label="신규 회원"
          value={String(newMembersThisMonth)}
          sub="이번 달"
        />
      </div>

      {/* 마케팅 지표 — 조회수 / 전환율 / 공유 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="상품 조회수 (30일)"
          value={totalViews.toLocaleString()}
          sub="24시간 중복 제외"
        />
        <StatCard
          label="결제 전환율"
          value={paymentConversion !== null ? `${paymentConversion}%` : "—"}
          sub={`결제완료 ${paidOrdersCount} / 대기 ${pendingOrdersCount}`}
          highlight={paymentConversion !== null && paymentConversion >= 50}
        />
        <StatCard
          label="위시 → 구매 전환율"
          value={wishlistConversion !== null ? `${wishlistConversion}%` : "—"}
          sub={`위시 회원 ${wishlistUserIds.size}명 중 ${wishlistBuyers}명 구매`}
          highlight={wishlistConversion !== null && wishlistConversion >= 30}
        />
        <StatCard
          label="공유 (30일)"
          value={totalShares.toLocaleString()}
          sub="전 채널 합계"
        />
      </div>

      {/* Buyer Segments */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="신규 구매자 (1회 구매)"
          value={String(buyerSegments.newBuyers)}
          sub="첫 구매자 (전체 기간)"
        />
        <StatCard
          label="재구매자 (2회 이상)"
          value={String(buyerSegments.returning)}
          sub={
            buyerSegments.newBuyers + buyerSegments.returning > 0
              ? `${Math.round((buyerSegments.returning / (buyerSegments.newBuyers + buyerSegments.returning)) * 100)}% 재구매율`
              : "아직 데이터 없음"
          }
          highlight={buyerSegments.returning > 0}
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
          일별 매출 — 최근 30일
        </h2>
        <RevenueChart data={dailyData} />
        <p className="text-xs mt-2" style={{ color: "#4B5563" }}>
          주말은 밝은 보라색으로 표시 · paid / shipped / completed 주문만 집계
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
            상품별 매출 순위
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm" style={{ color: "#9CA3AF" }}>아직 주문 데이터가 없습니다.</p>
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
                          ({p.count}개 판매)
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
            상태별 주문 현황 (전체)
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
                        {count}건 ({pct}%)
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
              <p className="text-sm" style={{ color: "#9CA3AF" }}>아직 주문이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers by LTV */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
          고객 LTV 순위
        </h2>
        {topCustomers.length === 0 ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>아직 주문 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {topCustomers.map((c, idx) => {
              const maxLtv = topCustomers[0].total || 1;
              return (
                <div key={c.email}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "#F0E6FF" }}>
                      <span style={{ color: "#9CA3AF" }} className="mr-2">#{idx + 1}</span>
                      {c.email}
                    </span>
                    <span style={{ color: "#F59E0B" }}>
                      ${c.total.toFixed(0)}
                      <span className="ml-2 text-xs" style={{ color: "#9CA3AF" }}>
                        {c.count}건
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#2D2D4E" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.total / maxLtv) * 100}%`, background: "linear-gradient(90deg,#F59E0B,#F97316)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 상품별 상세 통계 */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
          상품별 상세 통계
        </h2>
        {productStats.length === 0 ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>등록된 상품이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                  {["상품", "조회수(30일)", "위시", "판매량", "매출", "공유(30일)", "조회→구매"].map((h, i) => (
                    <th key={h} className={`py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`} style={{ color: "#9CA3AF" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productStats.map((p) => (
                  <tr key={p.name} style={{ borderBottom: "1px solid #2D2D4E" }}>
                    <td className="py-2.5 pr-4" style={{ color: "#F0E6FF" }}>{p.name}</td>
                    <td className="py-2.5 text-right" style={{ color: "#9CA3AF" }}>{p.views.toLocaleString()}</td>
                    <td className="py-2.5 text-right" style={{ color: "#9CA3AF" }}>{p.wishes.toLocaleString()}</td>
                    <td className="py-2.5 text-right" style={{ color: "#9CA3AF" }}>{p.sales.toLocaleString()}</td>
                    <td className="py-2.5 text-right" style={{ color: "#A855F7" }}>${p.revenue.toFixed(0)}</td>
                    <td className="py-2.5 text-right" style={{ color: "#9CA3AF" }}>{p.shares.toLocaleString()}</td>
                    <td className="py-2.5 text-right" style={{ color: p.cvr >= 5 ? "#10B981" : "#6B7280" }}>{p.cvr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs mt-3" style={{ color: "#4B5563" }}>
          조회→구매 = (판매량 / 30일 조회수). 조회수·공유는 최근 30일, 위시·판매·매출은 전체 기간 기준.
        </p>
      </div>

      {/* 공유 채널별 통계 */}
      <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
          공유 채널별 (최근 30일)
        </h2>
        {totalShares === 0 ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>아직 공유 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(shareByChannel)
              .sort(([, a], [, b]) => b - a)
              .map(([channel, count]) => {
                const pct = Math.round((count / totalShares) * 100);
                return (
                  <div key={channel}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "#F0E6FF" }}>{SHARE_LABELS[channel] ?? channel}</span>
                      <span style={{ color: "#A855F7" }}>{count}회 ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#2D2D4E" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7C3AED,#A855F7)" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 결제수단·국가별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
            결제수단별 매출 (결제완료+)
          </h2>
          {gatewayEntries.length === 0 ? (
            <p className="text-sm" style={{ color: "#9CA3AF" }}>아직 결제 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {gatewayEntries.map(([gw, v]) => {
                const pct = Math.round((v.revenue / gatewayTotal) * 100);
                return (
                  <div key={gw}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "#F0E6FF" }}>{gw}</span>
                      <span style={{ color: "#A855F7" }}>${v.revenue.toFixed(0)} <span className="text-xs" style={{ color: "#9CA3AF" }}>({v.count}건 · {pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#2D2D4E" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7C3AED,#A855F7)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0E6FF" }}>
            국가별 매출 Top 10 (배송지 기준)
          </h2>
          {countryEntries.length === 0 ? (
            <p className="text-sm" style={{ color: "#9CA3AF" }}>아직 배송지 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {countryEntries.map(([country, v]) => {
                const pct = Math.round((v.revenue / countryTotal) * 100);
                return (
                  <div key={country}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "#F0E6FF" }}>{country}</span>
                      <span style={{ color: "#F59E0B" }}>${v.revenue.toFixed(0)} <span className="text-xs" style={{ color: "#9CA3AF" }}>({v.count}건 · {pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#2D2D4E" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#F59E0B,#F97316)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note on conversion tracking */}
      <div
        className="rounded-xl border p-5 text-sm"
        style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#9CA3AF" }}
      >
        <p className="font-medium mb-1" style={{ color: "#F0E6FF" }}>방문자(세션) 추적</p>
        <p>
          상품 조회수는 자체 집계(<code>product_views</code>)입니다. 전체 사이트 방문자·세션·유입경로 등은{" "}
          <strong style={{ color: "#A855F7" }}>Google Analytics 4</strong>에서 확인하세요
          (<code>.env.local</code>의 <code>NEXT_PUBLIC_GA_ID</code> 설정 시 활성화).
        </p>
      </div>
    </div>
  );
}
