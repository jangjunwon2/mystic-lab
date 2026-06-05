import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/payments/lemon";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { holdPoints, pointsToUsd, getPointsBalance, MIN_REDEEM_POINTS } from "@/lib/points";
import { computeServerSubtotalUsd } from "@/lib/payments/order-pricing";
import { randomUUID } from "crypto";
import type { OrderPayload } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, locale, discountAmount, discountCodeId, discountCode, referralCode, couponCode, shippingMethod, shippingAddress, pointsUsed } = body as OrderPayload & {
      discountAmount?: number;
      discountCodeId?: string | null;
      discountCode?: string | null;
      referralCode?: string | null;
      couponCode?: string | null;
      shippingMethod?: string;
      shippingAddress?: Record<string, string>;
      pointsUsed?: number;
    };

    if (!items?.length || !customerEmail) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const SHIPPING_COSTS: Record<string, number> = { standard: 0, express: 15 };
    const shippingUsd = shippingMethod ? (SHIPPING_COSTS[shippingMethod] ?? 0) : 0;
    // 클라이언트 단가를 신뢰하지 않고 DB 가격(+세트 할인)으로 서버 재계산
    const subtotalUsd = await computeServerSubtotalUsd(items);
    // 쿠폰 할인은 소계를 초과할 수 없음
    const couponDiscount = Math.max(0, Math.min(discountAmount ?? 0, subtotalUsd));

    // 마일리지 사용 — 로그인 회원의 가용 잔액(잔액 − 활성 hold) 내에서 원자적 예약(hold).
    // 예약량만큼만 할인에 반영 → 동시 결제 시 같은 포인트로 이중 할인되는 race 차단.
    let pointsSpent = 0;
    let pointsHoldRef: string | undefined;
    if (pointsUsed && pointsUsed > 0) {
      const supa = await createClient();
      const { data: { user } } = await supa.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = (await createAdminClient()) as any;
        // 최소 사용 한도($5) 미만이면 적립 사용 불가
        const balance = await getPointsBalance(admin, user.id);
        const maxByValue = Math.floor(Math.max(0, subtotalUsd - couponDiscount) * 100);
        const requested = balance >= MIN_REDEEM_POINTS ? Math.min(Math.trunc(pointsUsed), maxByValue) : 0;
        if (requested > 0) {
          const ref = randomUUID();
          pointsSpent = await holdPoints(admin, { userId: user.id, amount: requested, ref, minutes: 30 });
          if (pointsSpent > 0) pointsHoldRef = ref;
        }
      }
    }
    const pointsDiscountUsd = pointsToUsd(pointsSpent);

    const totalUsd = Math.max(0.5, subtotalUsd - couponDiscount - pointsDiscountUsd + shippingUsd);
    const krwRate = await getUsdToKrw();
    // LemonSqueezy stores KRW in "cents" (×100), so ₩1380 = 138000
    const amountKrw = Math.max(800, Math.round(totalUsd * krwRate));
    const amountCents = amountKrw * 100;

    // 전체 장바구니·메타를 서버측 pending_checkouts에 저장하고 LS엔 짧은 ref만 전달한다.
    // → LS custom 255자 제한 우회(항목 개수 무제한). 테이블 미배포 등으로 실패하면
    //   ref 없이 진행(createLemonCheckout이 압축 포맷으로 폴백, 항목 4개까지).
    let pendingRef: string | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = (await createAdminClient()) as any;
      const newRef = randomUUID();
      const { error: pendErr } = await admin.from("pending_checkouts").insert({
        ref: newRef,
        payload: {
          items,
          customerEmail,
          locale,
          discountCode: discountCode ?? null,
          discountCodeId: discountCodeId ?? null,
          referralCode: referralCode ?? null,
          couponCode: couponCode ?? null,
          shippingMethod: shippingMethod ?? null,
          shippingAddress: shippingAddress ?? null,
          pointsSpent,
          pointsHoldRef: pointsHoldRef ?? null,
        },
      });
      if (!pendErr) pendingRef = newRef;
      else console.error("[lemon-checkout] pending insert 실패(압축 폴백):", pendErr.message);
    } catch (e) {
      console.error("[lemon-checkout] pending insert 예외(압축 폴백):", e);
    }

    const url = await createLemonCheckout(
      { items, customerEmail, locale },
      amountCents,
      discountCodeId ?? undefined,
      discountCode ?? undefined,
      shippingMethod ?? undefined,
      shippingAddress ?? undefined,
      pointsSpent,
      pointsHoldRef,
      referralCode ?? undefined,
      couponCode ?? undefined,
      pendingRef,
    );

    // pointsSpent·pointsHoldRef를 클라이언트에 반환 → 성공페이지 폴백(lemon-confirm)도 동일 포인트 정산 가능
    // (웹훅·confirm 중 주문을 먼저 저장한 쪽만 정산, 나머지는 멱등 early-return → 정확히 1회 차감)
    return NextResponse.json({ url, pointsSpent, pointsHoldRef: pointsHoldRef ?? null });
  } catch (err) {
    console.error("[lemon-checkout]", err);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
