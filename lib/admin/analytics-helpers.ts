export interface OrderRow {
  total_usd: number;
  status: string;
  created_at: string;
  customer_email: string;
}

export interface OrderItemRow {
  product_id: string | null;
  quantity: number;
  price_usd: number;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

export interface SegBucket { label: string; customers: number; revenue: number; share: number }

export function getLtv(orders: OrderRow[]) {
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

export function getBuyerSegments(orders: OrderRow[]) {
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

export function getCustomerSegments(orders: OrderRow[]) {
  const map: Record<string, { total: number; count: number }> = {};
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    if (!map[o.customer_email]) map[o.customer_email] = { total: 0, count: 0 };
    map[o.customer_email].total += o.total_usd;
    map[o.customer_email].count += 1;
  }
  const custs = Object.values(map);
  const totalRev = custs.reduce((s, c) => s + c.total, 0) || 1;

  const bucketize = (defs: { label: string; test: (c: { total: number; count: number }) => boolean }[]): SegBucket[] =>
    defs.map((d) => {
      const inSeg = custs.filter(d.test);
      const revenue = inSeg.reduce((s, c) => s + c.total, 0);
      return { label: d.label, customers: inSeg.length, revenue, share: Math.round((revenue / totalRev) * 100) };
    });

  const frequency = bucketize([
    { label: "1회 구매", test: (c) => c.count === 1 },
    { label: "2~3회", test: (c) => c.count >= 2 && c.count <= 3 },
    { label: "4회 이상", test: (c) => c.count >= 4 },
  ]);
  const spend = bucketize([
    { label: "$50 미만", test: (c) => c.total < 50 },
    { label: "$50~149", test: (c) => c.total >= 50 && c.total < 150 },
    { label: "$150~499", test: (c) => c.total >= 150 && c.total < 500 },
    { label: "$500 이상", test: (c) => c.total >= 500 },
  ]);
  return { frequency, spend, totalCustomers: custs.length };
}

export function getDailyRevenue(orders: OrderRow[], days = 30) {
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
