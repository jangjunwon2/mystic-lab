import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/payments/toss";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount, items, customerEmail, totalUsd } =
      await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await confirmTossPayment(paymentKey, orderId, amount);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const resolvedEmail = customerEmail ?? result.data?.orderId ?? "";
    const resolvedItems = (items as CartItem[]) ?? [];

    const dbOrderId = await saveOrderToSupabase({
      gateway: "toss",
      gatewayRef: paymentKey,
      items: resolvedItems,
      customerEmail: resolvedEmail,
      totalUsd: totalUsd ?? 0,
      totalKrw: amount,
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
