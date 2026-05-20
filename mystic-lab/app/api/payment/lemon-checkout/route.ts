import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/payments/lemon";
import type { OrderPayload } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, locale, discountAmount, discountCodeId, discountCode } = body as OrderPayload & {
      discountAmount?: number;
      discountCodeId?: string | null;
      discountCode?: string | null;
    };

    if (!items?.length || !customerEmail) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const subtotalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
    const totalUsd = Math.max(0.5, subtotalUsd - (discountAmount ?? 0));
    const amountCents = Math.round(totalUsd * 100);

    const url = await createLemonCheckout(
      { items, customerEmail, locale },
      amountCents,
      discountCodeId ?? undefined,
      discountCode ?? undefined
    );

    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    console.error("[lemon-checkout]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
