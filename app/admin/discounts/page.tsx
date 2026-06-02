import { createAdminClient } from "@/lib/supabase/server";
import DiscountsAdminClient from "@/components/admin/DiscountsAdminClient";

export const metadata = { title: "할인 코드 — Admin" };

export default async function AdminDiscountsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data: codes } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <DiscountsAdminClient initialCodes={codes ?? []} />
    </div>
  );
}
