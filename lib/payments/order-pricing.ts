import { createAdminClient } from "@/lib/supabase/server";
import { loadAddonOptions, addonUnitPrice } from "./option-pricing";
import type { CartItem } from "./types";

export interface ServerLineTotals {
  subtotal: number;                    // 전체 소계(반올림)
  byProduct: Map<string, number>;      // product_id → 라인 합계(같은 상품 여러 줄 합산)
}

// 서버에서 DB 가격(+세트 할인)으로 라인별 합계를 재계산한다. 클라이언트가 보낸 단가는 신뢰하지 않는다.
// 알 수 없는 상품 ID는 0으로 처리(주문에서 제외 효과). 쿠폰 상품/카테고리 한정 할인 산출에 사용.
export async function computeServerLineTotals(items: CartItem[]): Promise<ServerLineTotals> {
  const byProduct = new Map<string, number>();
  if (!items?.length) return { subtotal: 0, byProduct };

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

  // 구매 옵션(애드온) 정의 로드 — 옵션의 연결 상품과 라인 상품이 일치할 때만 할인가 적용
  const optionIds = [...new Set(items.map((i) => i.option_id).filter(Boolean))] as string[];
  const addonOptions = await loadAddonOptions(admin, optionIds);

  let subtotal = 0;
  for (const it of items) {
    const dbPrice = priceMap.get(it.id);
    if (dbPrice == null) continue;
    let unit = dbPrice;
    const opt = it.option_id ? addonOptions.get(it.option_id) : undefined;
    // 세트(번들) 구성품 — 기존 호환
    if (it.bundle_id && bundleDiscount.has(it.bundle_id) && bundleProducts.get(it.bundle_id)?.has(it.id)) {
      unit = Math.round(dbPrice * (1 - (bundleDiscount.get(it.bundle_id) ?? 0) / 100) * 100) / 100;
    } else if (opt && opt.linkedProductId === it.id) {
      // 애드온 옵션 정의 기반 할인가 — 클라이언트 단가 무시
      unit = addonUnitPrice(dbPrice, opt);
    }
    const qty = Math.max(1, Math.trunc(it.quantity));
    const line = unit * qty;
    subtotal += line;
    byProduct.set(it.id, (byProduct.get(it.id) ?? 0) + line);
  }
  for (const [k, v] of byProduct) byProduct.set(k, Math.round(v * 100) / 100);
  return { subtotal: Math.round(subtotal * 100) / 100, byProduct };
}

// 전체 소계만 필요할 때(기존 호출부 호환).
export async function computeServerSubtotalUsd(items: CartItem[]): Promise<number> {
  return (await computeServerLineTotals(items)).subtotal;
}
