// 상품 구매 옵션(함께 구매 가능한 애드온 상품)을 저장한다.
// 각 옵션 = 연결 상품 1개 + 할인(할인율% 또는 정액$).
export interface OptionInput {
  linked_product_id: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveProductOptions(admin: any, productId: string, options: OptionInput[]): Promise<void> {
  const rows = (options ?? []).filter((o) => o.linked_product_id);
  for (let idx = 0; idx < rows.length; idx++) {
    const o = rows[idx];
    await admin.from("product_options").insert({
      product_id: productId,
      linked_product_id: o.linked_product_id,
      discount_type: o.discount_type === "fixed" ? "fixed" : "percent",
      discount_value: Number(o.discount_value) || 0,
      display_order: idx,
    });
  }
}
