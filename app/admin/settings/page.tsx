import { createAdminClient } from "@/lib/supabase/server";
import { getPointEarnRate } from "@/lib/settings";
import { getSignupCouponConfig } from "@/lib/promotions";
import SettingsAdminClient from "@/components/admin/SettingsAdminClient";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const admin = await createAdminClient();
  const pointEarnRate = await getPointEarnRate(admin);
  const signupCoupon = await getSignupCouponConfig(admin);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>설정</h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          포인트 적립률·가입 쿠폰 등 사이트 전역 설정을 조정합니다.
        </p>
      </div>
      <SettingsAdminClient initialRate={pointEarnRate} initialSignupCoupon={signupCoupon} />
    </div>
  );
}
