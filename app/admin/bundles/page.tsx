import { createAdminClient } from "@/lib/supabase/server";
import BundlesManager from "@/components/admin/BundlesManager";

export const metadata = { title: "세트 상품 — Admin" };

interface RawProduct {
  id: string;
  slug: string;
  price_usd: number;
  product_translations: { name: string; language: string }[];
}

interface RawBundle {
  id: string;
  name: string;
  discount_percent: number;
  is_active: boolean;
  bundle_items: { product_id: string; quantity: number }[];
}

function pickName(translations: { name: string; language: string }[] | undefined, slug: string): string {
  return (
    translations?.find((t) => t.language === "ko")?.name ??
    translations?.find((t) => t.language === "en")?.name ??
    slug
  );
}

export default async function AdminBundlesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [productsRes, bundlesRes] = await Promise.all([
    supabase.from("products").select("id, slug, price_usd, product_translations(name, language)").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("bundles").select("id, name, discount_percent, is_active, bundle_items(product_id, quantity)").order("created_at", { ascending: false }),
  ]);

  const products = ((productsRes.data ?? []) as RawProduct[]).map((p) => ({
    id: p.id,
    name: pickName(p.product_translations, p.slug),
    price_usd: p.price_usd,
  }));

  const bundles = ((bundlesRes.data ?? []) as RawBundle[]).map((b) => ({
    id: b.id,
    name: b.name,
    discount_percent: b.discount_percent,
    is_active: b.is_active,
    items: (b.bundle_items ?? []).map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>세트 상품</h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        여러 상품을 묶어 할인가에 판매할 세트를 구성합니다. 할인율을 지정하면 개별가 합계에서 자동 할인됩니다.
      </p>
      <BundlesManager products={products} bundles={bundles} />
    </div>
  );
}
