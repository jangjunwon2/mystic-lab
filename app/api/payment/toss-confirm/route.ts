import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/payments/toss";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPointsBalance } from "@/lib/points";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount, items, customerEmail, totalUsd, shippingAddress, pointsUsed } =
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

    // 마일리지 사용 — 로그인 회원의 실제 잔액으로 검증
    let pointsSpent = 0;
    if (pointsUsed && pointsUsed > 0) {
      const supa = await createClient();
      const { data: { user } } = await supa.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = (await createAdminClient()) as any;
        const balance = await getPointsBalance(admin, user.id);
        pointsSpent = Math.max(0, Math.min(Math.trunc(pointsUsed), balance));
      }
    }

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
