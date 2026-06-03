import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/payments/toss";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPointsBalance, pointsToUsd } from "@/lib/points";
import { computeServerSubtotalUsd } from "@/lib/payments/order-pricing";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount, items, customerEmail, totalUsd, shippingAddress, pointsUsed, couponDiscount, shippingUsd } =
      await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const resolvedItemsPre = (items as CartItem[]) ?? [];

    // 마일리지 사용 — 로그인 회원의 실제 잔액으로 검증 (확정 전)
    let pointsSpent = 0;
    if (pointsUsed && pointsUsed > 0) {
      const supa = await createClient();
      const { data: { user } } = await supa.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adminP = (await createAdminClient()) as any;
        const balance = await getPointsBalance(adminP, user.id);
        pointsSpent = Math.max(0, Math.min(Math.trunc(pointsUsed), balance));
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
      // 5% 허용 오차(환율·반올림) — 그보다 적게 청구되면 가격 조작으로 간주
      if (Number(amount) < Math.floor(expectedKrw * 0.95)) {
        return NextResponse.json({ error: "결제 금액이 올바르지 않습니다." }, { status: 400 });
      }
    }

    const result = await confirmTossPayment(paymentKey, orderId, amount);

    if (!result.success) {
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
      shippingAddress: shippingAddress ?? undefined,
      pointsSpent,
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
