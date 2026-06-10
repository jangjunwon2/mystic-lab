import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/payments/toss";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { holdPoints, releaseHold, pointsToUsd, getPointsBalance, MIN_REDEEM_POINTS } from "@/lib/points";
import { computeServerLineTotals } from "@/lib/payments/order-pricing";
import { resolveOrderDiscountUsd } from "@/lib/coupons";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    const { paymentKey, orderId, amount, items, customerEmail, totalUsd, shippingAddress, pointsUsed, shippingUsd, referralCode, discountCode, couponCode } = body as {
      paymentKey?: string; orderId?: string; amount?: number;
      items?: CartItem[]; customerEmail?: string; totalUsd?: number;
      shippingAddress?: Record<string, string>; pointsUsed?: number; shippingUsd?: number;
      referralCode?: string | null; discountCode?: string | null; couponCode?: string | null;
    };

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const resolvedItemsPre = (items as CartItem[]) ?? [];

    // 로그인 세션에서 user_id 캡처 → 입력 이메일이 계정과 달라도 본인 주문으로 연결(저장 시 우선 사용).
    let authUserId: string | null = null;
    try {
      const supaAuth = await createClient();
      const { data: { user } } = await supaAuth.auth.getUser();
      authUserId = user?.id ?? null;
    } catch { /* 비로그인 */ }

    // 마일리지 사용 — 로그인 회원의 가용 잔액(잔액 − 활성 hold) 내에서 원자적 예약(hold). ref = paymentKey.
    // 동시 결제 시 같은 포인트로 이중 할인되는 race 차단.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adminP: any = null;
    let pointsSpent = 0;
    let pointsHeld = false;
    if (pointsUsed && pointsUsed > 0) {
      const supa = await createClient();
      const { data: { user } } = await supa.auth.getUser();
      if (user) {
        adminP = await createAdminClient();
        // 최소 사용 한도($5) 미만이면 적립 사용 불가
        const balance = await getPointsBalance(adminP, user.id);
        if (balance >= MIN_REDEEM_POINTS) {
          pointsSpent = await holdPoints(adminP, { userId: user.id, amount: Math.trunc(pointsUsed), ref: paymentKey, minutes: 30 });
          if (pointsSpent > 0) pointsHeld = true;
        }
      }
    }

    // 서버 가격 검증 — DB 가격(+세트) 기준 기대 청구액보다 현저히 적게 청구되면 거부 (확정 전)
    if (resolvedItemsPre.length > 0) {
      const { subtotal: serverSubtotal, byProduct } = await computeServerLineTotals(resolvedItemsPre);
      // 쿠폰/레퍼럴 할인 서버 재계산(클라이언트 값 불신). 상품 한정 시 해당 상품 소계에만.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminForDiscount = (await createAdminClient()) as any;
      const recomputed = await resolveOrderDiscountUsd(adminForDiscount, {
        couponCode, referralCode, userId: authUserId, email: customerEmail,
        subtotalUsd: serverSubtotal, lineTotalsByProduct: byProduct,
      });
      const coupon = Math.max(0, Math.min(recomputed, serverSubtotal));
      const ship = Math.max(0, Number(shippingUsd) || 0);
      const expectedUsd = Math.max(0, serverSubtotal - coupon - pointsToUsd(pointsSpent) + ship);
      const krwRate = await getUsdToKrw();
      const expectedKrw = expectedUsd * krwRate;
      // 5% 허용 오차(환율·반올림) — 그보다 적게 청구되면 가격 조작 또는 동시 결제로 예약 부족 → 예약 해제 후 거부
      if (Number(amount) < Math.floor(expectedKrw * 0.95)) {
        if (pointsHeld && adminP) await releaseHold(adminP, paymentKey);
        return NextResponse.json({ error: "결제 금액이 올바르지 않습니다." }, { status: 400 });
      }
    }

    const result = await confirmTossPayment(paymentKey, orderId, amount);

    if (!result.success) {
      if (pointsHeld && adminP) await releaseHold(adminP, paymentKey);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const resolvedEmail = customerEmail ?? result.data?.orderId ?? "";
    const resolvedItems = resolvedItemsPre;

    const dbOrderId = await saveOrderToSupabase({
      gateway: "toss",
      gatewayRef: paymentKey,
      items: resolvedItems,
      customerEmail: resolvedEmail,
      userId: authUserId,
      totalUsd: totalUsd ?? 0,
      totalKrw: amount,
      appliedDiscountCode: discountCode ?? undefined,
      appliedReferralCode: referralCode ?? undefined,
      appliedCouponCode: couponCode ?? undefined,
      shippingAddress: shippingAddress ?? undefined,
      shippingUsd: typeof shippingUsd === "number" ? shippingUsd : undefined,
      pointsSpent,
      pointsHoldRef: paymentKey,
    });

    if (resolvedEmail && resolvedItems.length > 0) {
      await sendOrderConfirmation({
        to: resolvedEmail,
        items: resolvedItems,
        totalUsd: totalUsd ?? 0,
        orderId: dbOrderId,
      }).catch((err) => console.error("[toss-confirm] Email send failed:", err));
    }

    return NextResponse.json({ success: true, orderId: dbOrderId });
  } catch (err) {
    console.error("[toss-confirm]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
