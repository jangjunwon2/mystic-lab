import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PromoAdminClient from "@/components/admin/PromoAdminClient";

export const metadata = { title: "프로모 페이지 관리 — Mystic Lab Admin" };

export default async function AdminPromoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/admin");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createAdminClient()) as any;

  const [pagesRes, couponsRes] = await Promise.all([
    db.from("promo_pages").select("id, slug, title, subtitle, description, image_url, badge_text, coupon_id, is_active, ends_at, created_at").order("created_at", { ascending: false }),
    db.from("issued_coupons").select("id, code, name, type, value, scope").eq("scope", "public").eq("is_active", true).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>프로모 페이지 관리</h1>
        <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
          쿠폰·이벤트 전용 랜딩 페이지를 생성하고 고객에게 URL을 공유하세요.<br />
          페이지 주소: <code className="text-xs px-1 py-0.5 rounded" style={{ background: "#1A1A2E", color: "#A855F7" }}>mystic-lab.vercel.app/ko/promo/슬러그</code>
        </p>
      </div>
      <PromoAdminClient
        initialPages={pagesRes.data ?? []}
        publicCoupons={couponsRes.data ?? []}
      />
    </div>
  );
}
