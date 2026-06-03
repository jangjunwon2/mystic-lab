import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/payments/lemon";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import type { OrderPayload } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, locale, discountAmount, discountCodeId, discountCode, shippingMethod, shippingAddress } = body as OrderPayload & {
      discountAmount?: number;
      discountCodeId?: string | null;
      discountCode?: string | null;
      shippingMethod?: string;
      shippingAddress?: Record<string, string>;
    };

    if (!items?.length || !customerEmail) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const SHIPPING_COSTS: Record<string, number> = { standard: 0, express: 15 };
    const shippingUsd = shippingMethod ? (SHIPPING_COSTS[shippingMethod] ?? 0) : 0;
    const subtotalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
    const totalUsd = Math.max(0.5, subtotalUsd - (discountAmount ?? 0) + shippingUsd);
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
      shippingAddress ?? undefined
    );

    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    console.error("[lemon-checkout]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
