import { createAdminClient } from "@/lib/supabase/server";
import CouponsAdminClient, { type IssuedCoupon } from "@/components/admin/CouponsAdminClient";

export const metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("issued_coupons")
    .select("id, code, email, user_id, type, value, source, min_order_usd, is_used, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>쿠폰 발급</h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          특정 회원/이메일에게 1회용 쿠폰을 지급합니다. (뉴스레터·레퍼럴 자동발급분도 함께 표시)
        </p>
      </div>
      <CouponsAdminClient initialCoupons={(data ?? []) as IssuedCoupon[]} />
    </div>
  );
}
