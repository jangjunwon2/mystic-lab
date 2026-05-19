import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/payments/lemon";
import type { OrderPayload } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerEmail, locale } = body as OrderPayload;

    if (!items?.length || !customerEmail) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const totalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
    const amountCents = Math.round(totalUsd * 100);

    const url = await createLemonCheckout({ items, customerEmail, locale }, amountCents);

    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    console.error("[lemon-checkout]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
