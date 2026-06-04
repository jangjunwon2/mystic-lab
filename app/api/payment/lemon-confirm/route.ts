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
      pointsSpent?: number;
      pointsHoldRef?: string | null;
    };

    const { items, customerEmail, totalUsd, shippingMethod, shippingAddress, discountCode, pointsSpent, pointsHoldRef } = body;

    if (!customerEmail || !items?.length) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // 실제 LS 주문 ID 조회 (환불 API 연동을 위해)
    let lsOrderId = body.lemonOrderId;
    if (!lsOrderId) {
      const lsKey = process.env.LEMON_SQUEEZY_API_KEY;
      const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
      if (lsKey && storeId) {
        try {
          const lsRes = await fetch(
            `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${storeId}&filter[user_email]=${encodeURIComponent(customerEmail)}&sort=-created_at&page[size]=1`,
            { headers: { Authorization: `Bearer ${lsKey}`, Accept: "application/vnd.api+json" } }
          );
          if (lsRes.ok) {
            const lsData = await lsRes.json();
            lsOrderId = lsData.data?.[0]?.id as string | undefined;
          }
        } catch { /* non-critical */ }
      }
    }

    const dbOrderId = await saveOrderToSupabase({
      gateway: "lemon",
      gatewayRef: lsOrderId ?? `lemon-success-${Date.now()}`,
      items,
      customerEmail,
      totalUsd,
      appliedDiscountCode: discountCode ?? undefined,
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
