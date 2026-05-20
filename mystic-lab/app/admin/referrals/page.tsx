import { createAdminClient } from "@/lib/supabase/server";
import ReferralsAdminClient from "@/components/admin/ReferralsAdminClient";

export const metadata = { title: "Referrals — Admin" };

export default async function AdminReferralsPage() {
  const admin = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: codes } = await (admin as any)
    .from("referral_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          Referral Codes
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          Create codes for affiliates and partners. Optionally attach a discount for buyers who use them.
        </p>
      </div>

      <ReferralsAdminClient initialCodes={codes ?? []} />
    </div>
  );
}
