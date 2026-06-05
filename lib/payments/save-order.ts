import { createAdminClient } from "@/lib/supabase/server";
import { sendLowStockAlert } from "@/lib/resend";
import { earnPointsForUsd, addPoints, consumeHold } from "@/lib/points";
import { getPointEarnRate } from "@/lib/settings";
import { issueCoupon, redeemCouponByCode } from "@/lib/coupons";
import type { SaveOrderInput } from "./types";

const LOW_STOCK_THRESHOLD = 3;

// email → auth.users.id 조회. RPC(017) 우선, 미배포 시 레거시 스캔으로 폴백.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUserId(supabase: any, email: string): Promise<string | null> {
  if (!email) return null;
  try {
    const { data, error } = await supabase.rpc("get_user_id_by_email", { p_email: email });
    if (!error && data) return data as string;
  } catch {
    // RPC 미배포 — 폴백
  }
  try {
    const { data: listRes } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return listRes?.users?.find((u: { email?: string; id: string }) => u.email === email)?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveOrderToSupabase(input: SaveOrderInput): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  // 게이트웨이 결제 식별자 — 멱등성 키. (lemon-webhook·lemon-confirm·toss-confirm 더블클릭/재시도 모두 이 키로 중복 차단)
  const gatewayKey =
    input.gateway === "toss" ? `toss_${input.gatewayRef}` : `lemon_${input.gatewayRef}`;

  // 멱등성: 같은 결제로 이미 주문이 저장됐으면 재처리하지 않고 기존 주문 ID 반환.
  // → 주문 중복 생성·포인트 이중 적립/차감·재고 이중 차감 방지.
  const { data: dup } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", gatewayKey)
    .maybeSingle();
  if (dup?.id) {
    return dup.id as string;
  }

  // 회원 연결 — 체크아웃에서 캡처한 로그인 user_id를 우선 사용(게이트웨이 이메일이 계정과 달라도 정확히 연결).
  // 없을 때만 이메일로 역추적(비로그인·레거시 폴백).
  const userId: string | null = input.userId ?? (await resolveUserId(supabase, input.customerEmail));

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
      stripe_payment_intent_id: gatewayKey,
      ...(input.appliedDiscountCode ? { applied_discount_code: input.appliedDiscountCode } : {}),
      ...(input.appliedReferralCode ? { applied_referral_code: input.appliedReferralCode } : {}),
      ...(input.customerNote ? { customer_note: input.customerNote } : {}),
      ...(input.shippingAddress ? { shipping_address: input.shippingAddress } : {}),
      ...(input.shippingMethod ? { shipping_method: input.shippingMethod } : {}),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    // confirm + webhook 동시 저장 race — 유니크 충돌(23505)이면 먼저 저장된 주문 id를 반환(멱등).
    // 위 dup 가드가 동시성으로 못 잡은 경우의 2차 방어. 에러 아님.
    if (orderError?.code === "23505") {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", gatewayKey)
        .maybeSingle();
      if (existing?.id) return existing.id as string;
    }
    console.error(`[${input.gateway}] saveOrder error:`, orderError);
    return null;
  }

  // 호스트·애드온 모두 개별 라인으로 저장 (애드온은 옵션 할인가, option_id 로 그룹/검증).
  const { error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price_usd: item.price_usd,
      option_name: item.option_name ?? null,
      option_id: item.option_id ?? null,
    }))
  );

  if (itemsError) {
    console.error(`[${input.gateway}] saveOrderItems error:`, itemsError);
  }

  // 마일리지 사용(차감) — 회원이 결제 시 포인트를 사용했을 때. 체크아웃에서 예약(hold)한 포인트를
  // 정산(consume): 해당 hold를 consumed 처리하고 FIFO 차감. (hold 없으면 그냥 FIFO 차감으로 폴백)
  if (userId && input.pointsSpent && input.pointsSpent > 0) {
    await consumeHold(supabase, {
      userId,
      ref: input.pointsHoldRef ?? gatewayKey,
      amount: input.pointsSpent,
      orderId: order.id,
      note: `주문 사용 (${input.gateway})`,
    }).catch(() => { /* 차감 실패는 주문에 영향 없음 */ });
  }

  // 할인 코드 사용횟수 증가 — 서버측·멱등(위 dup 가드로 신규 주문 1건만 여기 도달).
  // 전 게이트웨이(lemon-confirm·lemon-webhook·toss-confirm) 동일 처리 → 클라이언트 best-effort 호출 불필요.
  if (input.appliedDiscountCode) {
    const { data: dc } = await supabase
      .from("discount_codes")
      .select("id")
      .eq("code", input.appliedDiscountCode.toUpperCase())
      .maybeSingle();
    if (dc?.id) {
      await supabase
        .rpc("increment_discount_used", { code_id: dc.id })
        .catch(() => { /* 집계 실패는 주문에 영향 없음 */ });
    }
  }

  // 개인 발급 쿠폰 사용 처리(멱등) — dup 가드로 신규 주문 1건만 도달.
  if (input.appliedCouponCode) {
    await redeemCouponByCode(supabase, input.appliedCouponCode, order.id);
  }

  // 레퍼럴/제휴 코드 — 사용횟수 증가 + 추천인 보상 쿠폰 발급.
  // 멱등성: 같은 결제는 위 dup 가드에서 early-return되므로 여기까지 오면 신규 주문 1건뿐.
  if (input.appliedReferralCode) {
    const { data: rc } = await supabase
      .from("referral_codes")
      .select("id, referrer_email, referrer_reward_type, referrer_reward_value")
      .eq("code", input.appliedReferralCode)
      .maybeSingle();
    if (rc?.id) {
      await supabase
        .rpc("increment_referral_uses", { code_id: rc.id })
        .catch(() => { /* 집계 실패는 주문에 영향 없음 */ });
      // 추천인 보상 쿠폰(설정된 경우) — 추천인 이메일→회원 매칭 후 발급.
      if (rc.referrer_reward_type && Number(rc.referrer_reward_value) > 0 && rc.referrer_email) {
        const referrerUserId = await resolveUserId(supabase, rc.referrer_email);
        await issueCoupon(supabase, {
          userId: referrerUserId,
          email: rc.referrer_email,
          type: rc.referrer_reward_type === "fixed" ? "fixed" : "percent",
          value: Number(rc.referrer_reward_value),
          source: "referral",
        }).catch(() => { /* 발급 실패는 주문에 영향 없음 */ });
      }
    }
  }

  // 마일리지 적립 — 회원이며 결제 금액이 있을 때 (5%). 적립분은 12개월 후 만료.
  if (userId && input.totalUsd > 0) {
    const earnRate = await getPointEarnRate(supabase);
    const earned = earnPointsForUsd(input.totalUsd, earnRate);
    if (earned > 0) {
      await addPoints(supabase, {
        userId,
        amount: earned,
        type: "earn",
        orderId: order.id,
        note: `주문 적립 (${input.gateway})`,
      }).catch(() => { /* 적립 실패는 주문에 영향 없음 */ });
    }
  }

  // Decrement stock for each ordered product (세트 구성 상품 포함) and collect low-stock alerts.
  // 같은 상품이 여러 줄(개별+세트구성)일 수 있으므로 product_id 기준으로 수량 합산 후 1회 차감.
  const qtyByProduct = new Map<string, number>();
  for (const it of input.items) {
    qtyByProduct.set(it.id, (qtyByProduct.get(it.id) ?? 0) + it.quantity);
  }

  const lowStockItems: { productName: string; stock: number }[] = [];

  for (const [productId, qty] of qtyByProduct) {
    // 낙관적 동시성(CAS): stock=oldStock 조건부 업데이트가 0행이면 다른 결제가 끼어든 것 → 재읽기 후 재시도.
    // 동시 주문 시 lost update(oversell) 방지.
    let finalStock: number | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single();

      if (!product || typeof product.stock !== "number") break;

      const oldStock = product.stock;
      const newStock = Math.max(0, oldStock - qty);
      if (newStock === oldStock) {
        finalStock = oldStock; // 이미 0 — 변경 불필요
        break;
      }

      const { data: updated } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId)
        .eq("stock", oldStock)
        .select("id");

      if (updated && updated.length > 0) {
        finalStock = newStock; // 성공
        break;
      }
      // 0행 — 경합 발생, 재시도
    }

    if (finalStock != null && finalStock <= LOW_STOCK_THRESHOLD) {
      const { data: transKo } = await supabase
        .from("product_translations")
        .select("name")
        .eq("product_id", productId)
        .eq("language", "ko")
        .maybeSingle();
      const { data: transEn } = await supabase
        .from("product_translations")
        .select("name")
        .eq("product_id", productId)
        .eq("language", "en")
        .maybeSingle();
      lowStockItems.push({
        productName: transKo?.name ?? transEn?.name ?? productId,
        stock: finalStock,
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
