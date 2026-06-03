// 주문 환불 시 효과 되돌리기: 재고 복원 + 마일리지(적립 회수/사용 복원)
// 이미 처리됐으면(중복) 건너뛴다.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function reverseOrderEffects(admin: any, orderId: string): Promise<void> {
  if (!orderId) return;

  // 멱등성: 이미 이 주문에 refund 포인트 트랜잭션이 있으면 재처리하지 않음
  const { data: existingRefund } = await admin
    .from("point_transactions")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", "refund")
    .limit(1)
    .maybeSingle();
  if (existingRefund) return;

  // 1. 재고 복원
  const { data: items } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);
  for (const it of (items ?? []) as { product_id: string | null; quantity: number }[]) {
    if (!it.product_id) continue;
    const { data: p } = await admin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
    if (p && typeof p.stock === "number") {
      await admin.from("products").update({ stock: p.stock + it.quantity }).eq("id", it.product_id);
    }
  }

  // 2. 마일리지 상쇄 — 해당 주문의 earn/spend를 반대 부호로 기록 (적립 회수 / 사용 복원)
  const { data: pts } = await admin
    .from("point_transactions")
    .select("user_id, amount, type")
    .eq("order_id", orderId)
    .in("type", ["earn", "spend"]);
  for (const t of (pts ?? []) as { user_id: string; amount: number; type: string }[]) {
    await admin.from("point_transactions").insert({
      user_id: t.user_id,
      amount: -t.amount,
      type: "refund",
      order_id: orderId,
      note: `환불 상쇄 (${t.type})`,
    });
  }
}
