import { createAdminClient } from "@/lib/supabase/server";
import { getPointEarnRate } from "@/lib/settings";
import PointsAdminClient from "@/components/admin/PointsAdminClient";

export const metadata = { title: "Points — Admin" };

export default async function AdminPointsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = await createAdminClient() as any;
  const globalRate = await getPointEarnRate(admin);

  const { data } = await admin
    .from("products")
    .select("id, slug, point_earn_rate, product_translations(name, language)")
    .order("created_at", { ascending: false });

  const products = ((data ?? []) as {
    id: string;
    slug: string;
    point_earn_rate: number | null;
    product_translations: { name: string; language: string }[];
  }[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    point_earn_rate: p.point_earn_rate,
    name:
      p.product_translations.find((t) => t.language === "ko")?.name ??
      p.product_translations.find((t) => t.language === "en")?.name ??
      p.slug,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>포인트 설정</h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          마일리지 적립률을 전역 또는 상품별로 설정합니다. (100P = $1)
        </p>
      </div>
      <PointsAdminClient initialRate={globalRate} products={products} />
    </div>
  );
}
