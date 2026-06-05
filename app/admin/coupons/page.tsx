import { createAdminClient } from "@/lib/supabase/server";
import { getSignupCouponConfig } from "@/lib/promotions";
import CouponsAdminClient, { type IssuedCoupon } from "@/components/admin/CouponsAdminClient";
import SignupCouponCard from "@/components/admin/SignupCouponCard";

export const metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  const admin = await createAdminClient();
  const signupCoupon = await getSignupCouponConfig(admin);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("issued_coupons")
    .select("id, code, email, user_id, type, value, source, scope, max_uses, per_user_limit, used_count, is_active, min_order_usd, is_used, starts_at, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>쿠폰 발급</h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          개인 쿠폰(이메일 1회용) + 공개 쿠폰(누구나 쓰는 다회용 할인코드)을 발급합니다. (뉴스레터·레퍼럴 자동발급분도 함께 표시)
        </p>
      </div>
      <div className="mb-8">
        <SignupCouponCard initial={signupCoupon} />
      </div>
      <CouponsAdminClient initialCoupons={(data ?? []) as IssuedCoupon[]} />
    </div>
  );
}
