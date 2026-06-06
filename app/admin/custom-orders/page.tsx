import { createAdminClient } from "@/lib/supabase/server";
import CustomOrdersAdminTable from "@/components/admin/CustomOrdersAdminTable";

export const metadata = { title: "Custom Orders — Admin" };

export default async function AdminCustomOrdersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: requests } = await supabase
    .from("custom_order_requests")
    .select("id, name, email, description, budget_range, desired_deadline, status, admin_notes, created_at, image_urls, quoted_price_usd, quoted_price_krw, payment_token, payment_status")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        커스텀 주문
      </h1>
      <CustomOrdersAdminTable requests={requests ?? []} />
    </div>
  );
}
