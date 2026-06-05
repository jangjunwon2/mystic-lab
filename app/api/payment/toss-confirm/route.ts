import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/payments/toss";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { holdPoints, releaseHold, pointsToUsd, getPointsBalance, MIN_REDEEM_POINTS } from "@/lib/points";
import { computeServerSubtotalUsd } from "@/lib/payments/order-pricing";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount, items, customerEmail, totalUsd, shippingAddress, pointsUsed, couponDiscount, shippingUsd, referralCode, discountCode } =
      await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const resolvedItemsPre = (items as CartItem[]) ?? [];

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
      const serverSubtotal = await computeServerSubtotalUsd(resolvedItemsPre);
      const coupon = Math.max(0, Math.min(Number(couponDiscount) || 0, serverSubtotal));
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
      totalUsd: totalUsd ?? 0,
      totalKrw: amount,
      appliedDiscountCode: discountCode ?? undefined,
      appliedReferralCode: referralCode ?? undefined,
      shippingAddress: shippingAddress ?? undefined,
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
