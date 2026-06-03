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
      stripe_payment_intent_id,
      order_items(
        id, quantity, price_usd,
        products(slug, product_translations(name, language))
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

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
      <OrdersAdminTable orders={orders ?? []} />
    </div>
  );
}
