// 구매 옵션(함께 구매 가능한 애드온 상품) 가격 계산 + 정의 로드 공유 헬퍼.
// 각 옵션 = 연결된 상품 1개 + 할인(할인율 % 또는 정액 $). 다중 선택 시 각각 개별 라인으로 담긴다.

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface AddonOption {
  id: string;
  hostProductId: string;
  linkedProductId: string;
  discountType: "percent" | "fixed";
  discountValue: number;
}

export function addonUnitPrice(linkedPrice: number, opt: AddonOption): number {
  if (opt.discountType === "fixed") return Math.max(0, round2(linkedPrice - opt.discountValue));
  return Math.max(0, round2(linkedPrice * (1 - opt.discountValue / 100)));
}

// service-role 클라이언트로 옵션 정의를 일괄 로드한다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadAddonOptions(admin: any, optionIds: string[]): Promise<Map<string, AddonOption>> {
  const map = new Map<string, AddonOption>();
  const ids = [...new Set(optionIds.filter(Boolean))];
  if (ids.length === 0) return map;

  const { data: opts } = await admin
    .from("product_options")
    .select("id, product_id, linked_product_id, discount_type, discount_value")
    .in("id", ids);

  for (const o of (opts ?? []) as {
    id: string; product_id: string; linked_product_id: string | null; discount_type: string | null; discount_value: number | null;
  }[]) {
    if (!o.linked_product_id) continue;
    map.set(o.id, {
      id: o.id,
      hostProductId: o.product_id,
      linkedProductId: o.linked_product_id,
      discountType: o.discount_type === "fixed" ? "fixed" : "percent",
      discountValue: Number(o.discount_value) || 0,
    });
  }
  return map;
}
