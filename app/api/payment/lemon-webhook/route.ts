import { NextRequest, NextResponse } from "next/server";
import { verifyLemonWebhook } from "@/lib/payments/lemon";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation, sendRefundConfirmation } from "@/lib/resend";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import type { CartItem } from "@/lib/payments/types";

export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(`lemon-webhook:${getClientIP(request)}`, 300, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
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

      if (orderRow && orderRow.status !== "refunded") {
        // status 먼저 업데이트 → 분산 락 역할. webhook 재시도 시 중복 실행 방지.
        await supabase.from("orders").update({ status: "refunded" }).eq("id", orderRow.id);
        const { reverseOrderEffects } = await import("@/lib/payments/refund-order");
        await reverseOrderEffects(supabase, orderRow.id); // 재고·마일리지 복원 (내부도 idempotent)
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

  // 커스텀 주문 결제 — custom_order_token이 있으면 일반 주문 플로우 건너뜀
  const metaEarly = event.meta as Record<string, unknown> | undefined;
  const customEarly = (metaEarly?.custom_data as Record<string, string>) ?? {};
  if (customEarly.custom_order_token) {
    const coToken = customEarly.custom_order_token;
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = (await createAdminClient()) as any;
      await admin
        .from("custom_order_requests")
        .update({ payment_status: "paid", status: "in_progress" })
        .eq("payment_token", coToken)
        .eq("payment_status", "unpaid");
    } catch (e) {
      console.error("[lemon-webhook] custom order update failed:", e);
    }
    return NextResponse.json({ received: true });
  }

  const email = (attributes?.user_email as string) ?? "";
  const orderId = (data?.id as string) ?? "";
  // Store is KRW: total is in KRW "cents" (×100). Convert to USD.
  const totalKrwCents = (attributes?.total as number) ?? 0;
  const krwRate = await getUsdToKrw();
  const totalUsd = totalKrwCents / 100 / krwRate;

  // 주문 데이터 복원. ref가 있으면 서버측 pending_checkouts에서(항목 무제한),
  // 없으면 레거시 custom 필드에서 직접 복원(압축 포맷 + 구 포맷 호환).
  const meta = event.meta as Record<string, unknown> | undefined;
  const custom = (meta?.custom_data as Record<string, string>) ?? {};

  let items: CartItem[] = [];
  let orderUserId: string | undefined;
  let appliedDiscountCode: string | undefined;
  let appliedReferralCode: string | undefined;
  let appliedCouponCode: string | undefined;
  let shippingMethod: string | undefined;
  let shippingAddress: Record<string, string> | undefined;
  let pointsSpent = 0;
  let pointsHoldRef: string | undefined;

  if (custom.ref) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = (await createAdminClient()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const { data: pending } = await admin
        .from("pending_checkouts")
        .select("payload")
        .eq("ref", custom.ref)
        .maybeSingle();
      const p = (pending?.payload ?? {}) as Record<string, unknown>;
      if (Array.isArray(p.items)) items = p.items as CartItem[];
      orderUserId = (p.userId as string) || undefined;
      appliedDiscountCode = (p.discountCode as string) || undefined;
      appliedReferralCode = (p.referralCode as string) || undefined;
      appliedCouponCode = (p.couponCode as string) || undefined;
      shippingMethod = (p.shippingMethod as string) || undefined;
      shippingAddress = (p.shippingAddress as Record<string, string>) || undefined;
      pointsSpent = typeof p.pointsSpent === "number" ? p.pointsSpent : 0;
      pointsHoldRef = (p.pointsHoldRef as string) || undefined;
    } catch (e) {
      console.error("[lemon-webhook] pending_checkouts 조회 실패:", e);
    }
  } else {
    try {
      if (custom.order_items) {
        // 압축 포맷({i,q,p}) → CartItem 복원. (구 포맷 {id,qty,price}도 호환)
        const raw = JSON.parse(custom.order_items) as Array<{ i?: string; id?: string; q?: number; qty?: number; p?: number; price?: number }>;
        items = raw.map((r) => ({
          id: r.i ?? r.id ?? "",
          slug: "",
          name: "",
          price_usd: r.p ?? r.price ?? 0,
          quantity: r.q ?? r.qty ?? 1,
        }));
      }
    } catch {
      console.error("[lemon-webhook] Failed to parse custom_data");
    }
    appliedDiscountCode = custom.discount_code || undefined;
    appliedReferralCode = custom.referral_code || undefined;
    appliedCouponCode = custom.coupon_code || undefined;
    shippingMethod = custom.shipping_method || undefined;
    pointsSpent = custom.points_used ? parseInt(custom.points_used, 10) || 0 : 0;
    pointsHoldRef = custom.points_hold_ref || undefined;
    if (custom.shipping_address) {
      try {
        shippingAddress = JSON.parse(custom.shipping_address);
      } catch {
        console.error("[lemon-webhook] Failed to parse shipping_address");
      }
    }
  }

  const dbOrderId = await saveOrderToSupabase({
    gateway: "lemon",
    gatewayRef: orderId,
    items,
    customerEmail: email,
    userId: orderUserId,
    totalUsd,
    appliedDiscountCode,
    appliedReferralCode,
    appliedCouponCode,
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
