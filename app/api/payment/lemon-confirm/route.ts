import { NextRequest, NextResponse } from "next/server";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      lemonOrderId?: string;
      items: CartItem[];
      customerEmail: string;
      totalUsd: number;
      shippingMethod?: string;
      shippingAddress?: Record<string, string>;
      discountCode?: string | null;
      discountCodeId?: string | null;
      referralCode?: string | null;
      couponCode?: string | null;
      pointsSpent?: number;
      pointsHoldRef?: string | null;
    };

    const { items, customerEmail, totalUsd, shippingMethod, shippingAddress, discountCode, referralCode, couponCode, pointsSpent, pointsHoldRef } = body;

    if (!customerEmail || !items?.length) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // 결제 검증 — 실제 LS 주문이 결제완료(paid)인지 확인한 뒤에만 저장한다.
    // 검증 불가/실패 시 저장하지 않고 웹훅(lemon-webhook)에 위임 → 인증 없는 주문 위조 차단.
    const lsKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    let lsOrderId = body.lemonOrderId;
    if (lsKey && storeId) {
      const headers = { Authorization: `Bearer ${lsKey}`, Accept: "application/vnd.api+json" };
      let paid = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let order: any = null;
        if (lsOrderId) {
          const r = await fetch(`https://api.lemonsqueezy.com/v1/orders/${encodeURIComponent(lsOrderId)}`, { headers });
          if (r.ok) order = (await r.json()).data;
        } else {
          const r = await fetch(
            `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${storeId}&filter[user_email]=${encodeURIComponent(customerEmail)}&sort=-created_at&page[size]=1`,
            { headers }
          );
          if (r.ok) {
            const j = await r.json();
            order = j.data?.[0];
            lsOrderId = order?.id as string | undefined;
          }
        }
        const status = order?.attributes?.status as string | undefined;
        const orderEmail = (order?.attributes?.user_email as string | undefined)?.toLowerCase();
        if (status === "paid" && (!orderEmail || orderEmail === customerEmail.toLowerCase())) {
          paid = true;
        }
      } catch {
        /* 검증 실패 → 미저장 */
      }
      if (!paid) {
        // 결제 미확인 — 저장하지 않음(웹훅이 정상 주문을 처리). 위조 시도 차단.
        return NextResponse.json({ pending: true });
      }
    }
    // LS 키 미설정(dev/mock)에서는 검증 생략(운영 환경 아님).

    const dbOrderId = await saveOrderToSupabase({
      gateway: "lemon",
      gatewayRef: lsOrderId ?? `lemon-success-${Date.now()}`,
      items,
      customerEmail,
      totalUsd,
      appliedDiscountCode: discountCode ?? undefined,
      appliedReferralCode: referralCode ?? undefined,
      appliedCouponCode: couponCode ?? undefined,
      shippingMethod,
      shippingAddress,
      pointsSpent: pointsSpent ?? undefined,
      pointsHoldRef: pointsHoldRef ?? undefined,
    });

    if (customerEmail && items.length > 0) {
      await sendOrderConfirmation({ to: customerEmail, items, totalUsd, orderId: dbOrderId }).catch(
        (err) => console.error("[lemon-confirm] Email send failed:", err)
      );
    }

    return NextResponse.json({ success: true, orderId: dbOrderId });
  } catch (err) {
    console.error("[lemon-confirm]", err);
    return NextResponse.json({ error: "Failed to save order." }, { status: 500 });
  }
}
