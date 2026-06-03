import { createAdminClient } from "@/lib/supabase/server";
import type { CartItem } from "./types";

// 서버에서 DB 가격(+세트 할인)으로 소계를 재계산한다. 클라이언트가 보낸 단가는 신뢰하지 않는다.
// 알 수 없는 상품 ID는 0으로 처리(주문에서 제외 효과).
export async function computeServerSubtotalUsd(items: CartItem[]): Promise<number> {
  if (!items?.length) return 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  const productIds = [...new Set(items.map((i) => i.id))];
  const { data: prods } = await admin.from("products").select("id, price_usd").in("id", productIds);
  const priceMap = new Map<string, number>(
    ((prods ?? []) as { id: string; price_usd: number }[]).map((p) => [p.id, p.price_usd])
  );

  const bundleIds = [...new Set(items.map((i) => i.bundle_id).filter(Boolean))] as string[];
  const bundleDiscount = new Map<string, number>();
  const bundleProducts = new Map<string, Set<string>>();
  if (bundleIds.length > 0) {
    const { data: bs } = await admin
      .from("bundles")
      .select("id, discount_percent, is_active, bundle_items(product_id)")
      .in("id", bundleIds);
    for (const b of (bs ?? []) as { id: string; discount_percent: number; is_active: boolean; bundle_items: { product_id: string }[] }[]) {
      if (!b.is_active) continue;
      bundleDiscount.set(b.id, b.discount_percent);
      bundleProducts.set(b.id, new Set((b.bundle_items ?? []).map((x) => x.product_id)));
    }
  }

  let subtotal = 0;
  for (const it of items) {
    const dbPrice = priceMap.get(it.id);
    if (dbPrice == null) continue;
    let unit = dbPrice;
    // 세트 구성품이고, 해당 세트가 활성이며 실제 그 세트에 포함된 상품일 때만 세트 할인가 적용
    if (it.bundle_id && bundleDiscount.has(it.bundle_id) && bundleProducts.get(it.bundle_id)?.has(it.id)) {
      unit = Math.round(dbPrice * (1 - (bundleDiscount.get(it.bundle_id) ?? 0) / 100) * 100) / 100;
    }
    const qty = Math.max(1, Math.trunc(it.quantity));
    subtotal += unit * qty;
  }
  return Math.round(subtotal * 100) / 100;
}
