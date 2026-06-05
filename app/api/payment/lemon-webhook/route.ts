import { NextRequest, NextResponse } from "next/server";
import { verifyLemonWebhook } from "@/lib/payments/lemon";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation, sendRefundConfirmation } from "@/lib/resend";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  const valid = await verifyLemonWebhook(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = (event.meta as Record<string, unknown> | undefined)?.event_name as string | undefined;

  // order_refunded — DB 상태 업데이트 + 환불 이메일
  if (eventName === "order_refunded") {
    const data = event.data as Record<string, unknown> | undefined;
    const attributes = data?.attributes as Record<string, unknown> | undefined;
    const lsOrderId = data?.id as string | undefined;
    const email = attributes?.user_email as string | undefined;
    const totalKrwCents = (attributes?.total as number) ?? 0;
    const krwRate = await getUsdToKrw();
    const totalUsd = totalKrwCents / 100 / krwRate;

    if (lsOrderId) {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const supabase = await createAdminClient() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const { data: orderRow } = await supabase
        .from("orders")
        .select("id, customer_email, total_usd")
        .eq("stripe_payment_intent_id", `lemon_${lsOrderId}`)
        .maybeSingle();

      if (orderRow) {
        const { reverseOrderEffects } = await import("@/lib/payments/refund-order");
        await reverseOrderEffects(supabase, orderRow.id); // 재고·마일리지 복원
        await supabase.from("orders").update({ status: "refunded" }).eq("id", orderRow.id);
        sendRefundConfirmation({
          to: orderRow.customer_email ?? email ?? "",
          orderId: orderRow.id,
          totalUsd: orderRow.total_usd ?? totalUsd,
        }).catch((err) => console.error("[lemon-webhook/refund] email:", err));
      }
    }
    return NextResponse.json({ received: true });
  }

  // Only handle order_created below
  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const data = event.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;

  const email = (attributes?.user_email as string) ?? "";
  const orderId = (data?.id as string) ?? "";
  // Store is KRW: total is in KRW "cents" (×100). Convert to USD.
  const totalKrwCents = (attributes?.total as number) ?? 0;
  const krwRate = await getUsdToKrw();
  const totalUsd = totalKrwCents / 100 / krwRate;

  // Decode cart items from custom metadata
  let items: CartItem[] = [];
  let appliedDiscountCode: string | undefined;
  let appliedReferralCode: string | undefined;
  try {
    const meta = event.meta as Record<string, unknown> | undefined;
    const custom = (meta?.custom_data as Record<string, string>) ?? {};
    if (custom.order_items) {
      items = JSON.parse(custom.order_items);
    }
    if (custom.discount_code) {
      appliedDiscountCode = custom.discount_code;
    }
    if (custom.referral_code) {
      appliedReferralCode = custom.referral_code;
    }
  } catch {
    console.error("[lemon-webhook] Failed to parse custom_data");
  }

  const webhookMeta = event.meta as Record<string, unknown> | undefined;
  const webhookCustom = (webhookMeta?.custom_data as Record<string, string>) ?? {};
  const shippingMethod = webhookCustom.shipping_method ?? undefined;
  const pointsSpent = webhookCustom.points_used ? parseInt(webhookCustom.points_used, 10) || 0 : 0;
  const pointsHoldRef = webhookCustom.points_hold_ref ?? undefined;

  let shippingAddress: Record<string, string> | undefined;
  if (webhookCustom.shipping_address) {
    try {
      shippingAddress = JSON.parse(webhookCustom.shipping_address);
    } catch {
      console.error("[lemon-webhook] Failed to parse shipping_address");
    }
  }

  const dbOrderId = await saveOrderToSupabase({
    gateway: "lemon",
    gatewayRef: orderId,
    items,
    customerEmail: email,
    totalUsd,
    appliedDiscountCode,
    appliedReferralCode,
    shippingMethod,
    shippingAddress,
    pointsSpent,
    pointsHoldRef,
  });

  if (email && items.length > 0) {
    await sendOrderConfirmation({ to: email, items, totalUsd, orderId: dbOrderId }).catch(
      (err) => console.error("[lemon-webhook] Email send failed:", err)
    );
  }

  return NextResponse.json({ received: true });
}
