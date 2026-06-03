import { createAdminClient } from "@/lib/supabase/server";
import ShippingAdminTable from "@/components/admin/ShippingAdminTable";

export const metadata = { title: "배송 관리 — Admin" };

export default async function AdminShippingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, customer_email, status, created_at,
      shipping_method, shipping_address, tracking_number, tracking_carrier,
      order_items(
        id, quantity, price_usd,
        products(slug, product_translations(name, language))
      )
    `)
    .in("status", ["paid", "shipped", "completed"])
    .order("created_at", { ascending: false })
    .limit(500);

  const all = orders ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          배송 관리
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
          결제 완료된 주문의 발송 처리 및 배송 추적을 관리합니다.
        </p>
      </div>
      <ShippingAdminTable orders={all} />
    </div>
  );
}
