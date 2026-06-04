// 구매 옵션(추가옵션·세트) 가격 계산 + 정의 로드 공유 헬퍼.
// 세트가 = set_price_usd(고정가) 우선, 없으면 (호스트가 + 구성 상품 합계) × (1 - discount%/100)
// 단순 추가옵션 = 호스트가 + price_delta_usd

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface OptionItemDef {
  productId: string;
  quantity: number;
  price: number;
}

export interface OptionDef {
  id: string;
  productId: string; // 호스트(이 옵션이 달린) 상품 id
  priceDelta: number;
  setPrice: number | null;
  discountPercent: number | null;
  items: OptionItemDef[];
}

export function computeOptionPrice(hostPrice: number, def: OptionDef): number {
  if (def.items.length === 0) {
    return Math.max(0, round2(hostPrice + def.priceDelta));
  }
  const componentsTotal = def.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const base = hostPrice + componentsTotal;
  if (def.setPrice != null) return Math.max(0, round2(def.setPrice));
  const d = def.discountPercent ?? 0;
  return Math.max(0, round2(base * (1 - d / 100)));
}

// service-role 클라이언트로 옵션 정의(구성 상품 가격 포함)를 일괄 로드한다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadOptionDefs(admin: any, optionIds: string[]): Promise<Map<string, OptionDef>> {
  const map = new Map<string, OptionDef>();
  const ids = [...new Set(optionIds.filter(Boolean))];
  if (ids.length === 0) return map;

  const { data: opts } = await admin
    .from("product_options")
    .select("id, product_id, price_delta_usd, set_price_usd, discount_percent")
    .in("id", ids);
  if (!opts?.length) return map;

  const { data: items } = await admin
    .from("product_option_items")
    .select("option_id, product_id, quantity")
    .in("option_id", ids);

  const compIds = [...new Set(((items ?? []) as { product_id: string }[]).map((i) => i.product_id))];
  const priceMap = new Map<string, number>();
  if (compIds.length > 0) {
    const { data: prods } = await admin.from("products").select("id, price_usd").in("id", compIds);
    for (const p of (prods ?? []) as { id: string; price_usd: number }[]) {
      priceMap.set(p.id, Number(p.price_usd) || 0);
    }
  }

  for (const o of opts as { id: string; product_id: string; price_delta_usd: number; set_price_usd: number | null; discount_percent: number | null }[]) {
    map.set(o.id, {
      id: o.id,
      productId: o.product_id,
      priceDelta: Number(o.price_delta_usd) || 0,
      setPrice: o.set_price_usd != null ? Number(o.set_price_usd) : null,
      discountPercent: o.discount_percent != null ? Number(o.discount_percent) : null,
      items: [],
    });
  }
  for (const it of (items ?? []) as { option_id: string; product_id: string; quantity: number }[]) {
    const def = map.get(it.option_id);
    if (def) def.items.push({ productId: it.product_id, quantity: it.quantity, price: priceMap.get(it.product_id) ?? 0 });
  }
  return map;
}
