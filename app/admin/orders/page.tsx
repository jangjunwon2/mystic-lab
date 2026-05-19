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
      order_items(
        id, quantity, price_usd,
        products(slug, product_translations(name, language))
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        Orders
      </h1>
      <OrdersAdminTable orders={orders ?? []} />
    </div>
  );
}
