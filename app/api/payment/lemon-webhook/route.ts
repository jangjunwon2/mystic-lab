import { NextRequest, NextResponse } from "next/server";
import { verifyLemonWebhook } from "@/lib/payments/lemon";
import { saveOrderToSupabase } from "@/lib/payments/save-order";
import { sendOrderConfirmation } from "@/lib/resend";
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

  // Only handle successful orders
  const eventName = event.meta && (event.meta as Record<string, unknown>).event_name;
  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const data = event.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const customData = attributes?.first_order_item as Record<string, unknown> | undefined;

  const email = (attributes?.user_email as string) ?? "";
  const orderId = (data?.id as string) ?? "";
  const totalUsd = ((attributes?.total as number) ?? 0) / 100;

  // Decode cart items from custom metadata
  let items: CartItem[] = [];
  try {
    const meta = event.meta as Record<string, unknown> | undefined;
    const custom = (meta?.custom_data as Record<string, string>) ?? {};
    if (custom.order_items) {
      items = JSON.parse(custom.order_items);
    }
  } catch {
    console.error("[lemon-webhook] Failed to parse order_items from custom_data");
  }

  const dbOrderId = await saveOrderToSupabase({
    gateway: "lemon",
    gatewayRef: orderId,
    items,
    customerEmail: email,
    totalUsd,
  });

  void customData; // suppress unused warning

  if (email && items.length > 0) {
    await sendOrderConfirmation({ to: email, items, totalUsd, orderId: dbOrderId }).catch(
      (err) => console.error("[lemon-webhook] Email send failed:", err)
    );
  }

  return NextResponse.json({ received: true });
}
