import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/payments/lemon";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPointsBalance, pointsToUsd } from "@/lib/points";
import type { OrderPayload } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, locale, discountAmount, discountCodeId, discountCode, shippingMethod, shippingAddress, pointsUsed } = body as OrderPayload & {
      discountAmount?: number;
      discountCodeId?: string | null;
      discountCode?: string | null;
      shippingMethod?: string;
      shippingAddress?: Record<string, string>;
      pointsUsed?: number;
    };

    if (!items?.length || !customerEmail) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const SHIPPING_COSTS: Record<string, number> = { standard: 0, express: 15 };
    const shippingUsd = shippingMethod ? (SHIPPING_COSTS[shippingMethod] ?? 0) : 0;
    const subtotalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
    const couponDiscount = discountAmount ?? 0;

    // 마일리지 사용 — 로그인 회원의 실제 잔액으로 서버 검증 후 차감액 결정
    let pointsSpent = 0;
    if (pointsUsed && pointsUsed > 0) {
      const supa = await createClient();
      const { data: { user } } = await supa.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = (await createAdminClient()) as any;
        const balance = await getPointsBalance(admin, user.id);
        const maxByValue = Math.floor(Math.max(0, subtotalUsd - couponDiscount) * 100);
        pointsSpent = Math.min(Math.trunc(pointsUsed), balance, maxByValue);
        if (pointsSpent < 0) pointsSpent = 0;
      }
    }
    const pointsDiscountUsd = pointsToUsd(pointsSpent);

    const totalUsd = Math.max(0.5, subtotalUsd - couponDiscount - pointsDiscountUsd + shippingUsd);
    const krwRate = await getUsdToKrw();
    // LemonSqueezy stores KRW in "cents" (×100), so ₩1380 = 138000
    const amountKrw = Math.max(800, Math.round(totalUsd * krwRate));
    const amountCents = amountKrw * 100;

    const url = await createLemonCheckout(
      { items, customerEmail, locale },
      amountCents,
      discountCodeId ?? undefined,
      discountCode ?? undefined,
      shippingMethod ?? undefined,
      shippingAddress ?? undefined,
      pointsSpent,
    );

    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    console.error("[lemon-checkout]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
