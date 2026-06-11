import { createAdminClient } from "@/lib/supabase/server";
import ReferralsAdminClient from "@/components/admin/ReferralsAdminClient";

export const metadata = { title: "Referrals — Admin" };

export default async function AdminReferralsPage() {
  const admin = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: codes } = await (admin as any)
    .from("referral_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          레퍼럴 코드
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          파트너 및 제휴사를 위한 레퍼럴 코드를 생성합니다. 코드 사용 구매자에게 선택적으로 할인을 제공할 수 있습니다.
        </p>
      </div>

      <ReferralsAdminClient initialCodes={codes ?? []} />
    </div>
  );
}
