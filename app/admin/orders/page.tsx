import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import OrdersAdminTable from "@/components/admin/OrdersAdminTable";

export const metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, customer_email, total_usd, status, created_at, updated_at,
      shipped_at, completed_at,
      tracking_number, tracking_carrier, shipping_address, shipping_method,
      stripe_payment_intent_id, applied_discount_code, applied_referral_code, customer_note,
      order_items(
        id, quantity, price_usd, option_name,
        products(slug, product_translations(name, language))
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  // 주문별 마일리지 사용/적립 — point_transactions 배치 조회 후 맵핑
  const orderIds = ((orders ?? []) as { id: string }[]).map((o) => o.id);
  const pointsByOrder: Record<string, { spent: number; earned: number }> = {};
  if (orderIds.length > 0) {
    const { data: pts } = await supabase
      .from("point_transactions")
      .select("order_id, amount, type")
      .in("order_id", orderIds);
    for (const t of (pts ?? []) as { order_id: string; amount: number; type: string }[]) {
      const e = (pointsByOrder[t.order_id] ??= { spent: 0, earned: 0 });
      if (t.type === "spend") e.spent += Math.abs(t.amount);
      else if (t.type === "earn") e.earned += t.amount;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersWithPoints = ((orders ?? []) as any[]).map((o) => ({
    ...o,
    points_spent: pointsByOrder[o.id]?.spent ?? 0,
    points_earned: pointsByOrder[o.id]?.earned ?? 0,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          주문 관리
        </h1>
        <Link
          href="/admin/orders/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
        >
          + 수동 주문
        </Link>
      </div>
      <OrdersAdminTable orders={ordersWithPoints} />
    </div>
  );
}
