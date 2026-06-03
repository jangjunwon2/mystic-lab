import { createAdminClient } from "@/lib/supabase/server";
import { sendLowStockAlert } from "@/lib/resend";
import { earnPointsForUsd, addPointTransaction } from "@/lib/points";
import type { SaveOrderInput } from "./types";

const LOW_STOCK_THRESHOLD = 3;

export async function saveOrderToSupabase(input: SaveOrderInput): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  // Resolve user_id from email
  let userId: string | null = null;
  try {
    const { data: listRes } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = listRes?.users?.find((u: { email?: string; id: string }) => u.email === input.customerEmail)?.id ?? null;
  } catch {
    // non-critical — order saves without user_id
  }

  // 디지털 상품만으로 구성된 주문은 배송이 없으므로 결제 즉시 completed 처리 → 바로 리뷰 작성 가능
  let allDigital = false;
  try {
    const ids = input.items.map((i) => i.id);
    const { data: prods } = await supabase
      .from("products")
      .select("id, is_digital")
      .in("id", ids);
    const digitalMap = new Map<string, boolean>(
      ((prods ?? []) as { id: string; is_digital: boolean }[]).map((p) => [p.id, !!p.is_digital])
    );
    allDigital = ids.length > 0 && ids.every((id) => digitalMap.get(id) === true);
  } catch {
    // non-critical — 조회 실패 시 기본(paid)
  }
  const nowIso = new Date().toISOString();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      status: allDigital ? "completed" : "paid",
      ...(allDigital ? { completed_at: nowIso } : {}),
      total_usd: input.totalUsd,
      customer_email: input.customerEmail,
      ...(userId ? { user_id: userId } : {}),
      ...(input.gateway === "toss"
        ? { stripe_payment_intent_id: `toss_${input.gatewayRef}` }
        : { stripe_payment_intent_id: `lemon_${input.gatewayRef}` }),
      ...(input.appliedDiscountCode ? { applied_discount_code: input.appliedDiscountCode } : {}),
      ...(input.appliedReferralCode ? { applied_referral_code: input.appliedReferralCode } : {}),
      ...(input.customerNote ? { customer_note: input.customerNote } : {}),
      ...(input.shippingAddress ? { shipping_address: input.shippingAddress } : {}),
      ...(input.shippingMethod ? { shipping_method: input.shippingMethod } : {}),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error(`[${input.gateway}] saveOrder error:`, orderError);
    return null;
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price_usd: item.price_usd,
    }))
  );

  if (itemsError) {
    console.error(`[${input.gateway}] saveOrderItems error:`, itemsError);
  }

  // 마일리지 사용(차감) — 회원이 결제 시 포인트를 사용했을 때. 잔액 초과분은 보정
  if (userId && input.pointsSpent && input.pointsSpent > 0) {
    const { getPointsBalance } = await import("@/lib/points");
    const balance = await getPointsBalance(supabase, userId);
    const spend = Math.min(input.pointsSpent, balance);
    if (spend > 0) {
      await addPointTransaction(supabase, {
        userId,
        amount: -spend,
        type: "spend",
        orderId: order.id,
        note: `주문 사용 (${input.gateway})`,
      }).catch(() => { /* 차감 실패는 주문에 영향 없음 */ });
    }
  }

  // 마일리지 적립 — 회원이며 결제 금액이 있을 때 (5%)
  if (userId && input.totalUsd > 0) {
    const earned = earnPointsForUsd(input.totalUsd);
    if (earned > 0) {
      await addPointTransaction(supabase, {
        userId,
        amount: earned,
        type: "earn",
        orderId: order.id,
        note: `주문 적립 (${input.gateway})`,
      }).catch(() => { /* 적립 실패는 주문에 영향 없음 */ });
    }
  }

  // Decrement stock for each ordered product and collect low-stock items for alert
  const lowStockItems: { productName: string; stock: number }[] = [];

  for (const item of input.items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .single();

    if (!product || typeof product.stock !== "number") continue;

    const newStock = Math.max(0, product.stock - item.quantity);
    await supabase.from("products").update({ stock: newStock }).eq("id", item.id);

    if (newStock <= LOW_STOCK_THRESHOLD) {
      const { data: transKo } = await supabase
        .from("product_translations")
        .select("name")
        .eq("product_id", item.id)
        .eq("language", "ko")
        .maybeSingle();
      const { data: transEn } = await supabase
        .from("product_translations")
        .select("name")
        .eq("product_id", item.id)
        .eq("language", "en")
        .maybeSingle();
      lowStockItems.push({
        productName: transKo?.name ?? transEn?.name ?? item.id,
        stock: newStock,
      });
    }
  }

  if (lowStockItems.length > 0) {
    sendLowStockAlert(lowStockItems).catch((err) =>
      console.error("[saveOrder] Low stock alert failed:", err)
    );
  }

  return order.id as string;
}
