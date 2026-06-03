import { createAdminClient } from "@/lib/supabase/server";
import GiftManager from "@/components/admin/GiftManager";

export const metadata = { title: "증정 — Admin" };

interface RawProduct {
  id: string;
  slug: string;
  product_translations: { name: string; language: string }[];
}

function pickName(translations: { name: string; language: string }[] | undefined, slug: string): string {
  return (
    translations?.find((t) => t.language === "ko")?.name ??
    translations?.find((t) => t.language === "en")?.name ??
    slug
  );
}

export default async function AdminGiftsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: productsRes } = await supabase
    .from("products")
    .select("id, slug, product_translations(name, language)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products = ((productsRes ?? []) as RawProduct[]).map((p) => ({
    id: p.id,
    name: pickName(p.product_translations, p.slug),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>
        증정 / 권한 부여
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        구매하지 않은 회원에게도 사은품·행사용으로 상품 접근 권한을 부여하거나 상품을 무료로 발송할 수 있습니다.
        이메일 또는 이름으로 회원을 검색하세요.
      </p>
      <GiftManager products={products} />
    </div>
  );
}
