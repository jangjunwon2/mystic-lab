// 주문 환불 시 효과 되돌리기: 재고 복원 + 마일리지(적립 회수/사용 복원)
// 이미 처리됐으면(중복) 건너뛴다.
import { addPoints, spendPoints } from "@/lib/points";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function reverseOrderEffects(admin: any, orderId: string): Promise<void> {
  if (!orderId) return;

  // 멱등성: 주문 상태가 이미 "refunded"이거나 refund 포인트 트랜잭션이 있으면 재처리하지 않음
  const { data: orderRow } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderRow?.status === "refunded") return;

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
      // CAS: stock이 조회 시점과 다르면(동시 환불) 업데이트 skip — save-order.ts와 동일 패턴
      await admin.from("products")
        .update({ stock: p.stock + it.quantity })
        .eq("id", it.product_id)
        .eq("stock", p.stock);
    }
  }

  // 2. 마일리지 상쇄 (로트 기반)
  //  - 적립(earn, +)분: FIFO 소진으로 회수 (이미 사용·만료됐으면 남은 만큼만)
  //  - 사용(spend, -)분: 새 로트(12개월 만료)로 복원
  const { data: pts } = await admin
    .from("point_transactions")
    .select("user_id, amount, type")
    .eq("order_id", orderId)
    .in("type", ["earn", "spend"]);
  for (const t of (pts ?? []) as { user_id: string; amount: number; type: string }[]) {
    if (t.amount > 0) {
      await spendPoints(admin, {
        userId: t.user_id,
        amount: t.amount,
        type: "refund",
        orderId,
        note: "환불 회수 (적립분)",
      });
    } else if (t.amount < 0) {
      await addPoints(admin, {
        userId: t.user_id,
        amount: -t.amount,
        type: "refund",
        orderId,
        note: "환불 복원 (사용분)",
      });
    }
  }
}
