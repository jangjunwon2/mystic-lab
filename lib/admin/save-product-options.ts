// 상품 구매 옵션(추가옵션·세트)을 저장한다. 세트는 product_option_items 에 구성 상품을 함께 저장.
export interface OptionInput {
  name: string;
  price_delta_usd?: number;
  set_price_usd?: number | null;
  discount_percent?: number | null;
  items?: { product_id: string; quantity: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveProductOptions(admin: any, productId: string, options: OptionInput[]): Promise<void> {
  const rows = (options ?? []).filter((o) => o.name?.trim());
  for (let idx = 0; idx < rows.length; idx++) {
    const o = rows[idx];
    const { data: opt } = await admin
      .from("product_options")
      .insert({
        product_id: productId,
        name: o.name.trim(),
        price_delta_usd: Number(o.price_delta_usd) || 0,
        set_price_usd: o.set_price_usd != null ? Number(o.set_price_usd) : null,
        discount_percent: o.discount_percent != null ? Math.trunc(Number(o.discount_percent)) : null,
        display_order: idx,
      })
      .select("id")
      .single();

    if (opt && Array.isArray(o.items) && o.items.length > 0) {
      const itemRows = o.items
        .filter((it) => it.product_id)
        .map((it) => ({
          option_id: opt.id,
          product_id: it.product_id,
          quantity: Math.max(1, Math.trunc(Number(it.quantity) || 1)),
        }));
      if (itemRows.length > 0) await admin.from("product_option_items").insert(itemRows);
    }
  }
}
