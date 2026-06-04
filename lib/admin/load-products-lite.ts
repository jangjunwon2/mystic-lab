import { createAdminClient } from "@/lib/supabase/server";
import type { AdminProductLite } from "@/components/admin/ProductForm";

// 옵션(세트) 구성 상품 선택용 — 활성 상품의 id·이름(ko 우선)·가격 목록
export async function loadAllProductsLite(): Promise<AdminProductLite[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { data } = await supabase
    .from("products")
    .select("id, price_usd, product_translations(name, language)")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return ((data ?? []) as {
    id: string;
    price_usd: number;
    product_translations: { name: string; language: string }[];
  }[]).map((p) => ({
    id: p.id,
    price_usd: Number(p.price_usd) || 0,
    name:
      p.product_translations?.find((t) => t.language === "ko")?.name ??
      p.product_translations?.find((t) => t.language === "en")?.name ??
      p.id,
  }));
}
