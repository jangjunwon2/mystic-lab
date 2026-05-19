import { createAdminClient } from "@/lib/supabase/server";
import UnlockCodesManager from "@/components/admin/UnlockCodesManager";

export const metadata = { title: "Unlock Codes — Admin" };

interface RawProduct {
  id: string;
  slug: string;
  product_translations: { name: string; language: string }[];
}

interface RawCode {
  id: string;
  product_id: string;
  created_at: string;
  first_used_at: string | null;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

export default async function AdminUnlockCodesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [productsRes, codesRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, product_translations(name, language)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_unlock_codes")
      .select("id, product_id, created_at, first_used_at, products(slug, product_translations(name, language))")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const products = ((productsRes.data ?? []) as RawProduct[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.product_translations?.find((t) => t.language === "en")?.name ?? p.slug,
  }));

  const codes = ((codesRes.data ?? []) as RawCode[]).map((c) => ({
    id: c.id,
    product_id: c.product_id,
    created_at: c.created_at,
    first_used_at: c.first_used_at,
    product_name:
      c.products?.product_translations?.find((t) => t.language === "en")?.name ?? c.products?.slug ?? "Unknown",
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>
        Unlock Codes
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        Generate unique unlock codes for products. Include these codes inside the shipped package.
        Each code is shown only once — copy it before navigating away.
      </p>
      <UnlockCodesManager products={products} codes={codes} />
    </div>
  );
}
