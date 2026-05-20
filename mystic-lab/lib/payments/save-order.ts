import { createAdminClient } from "@/lib/supabase/server";
import type { SaveOrderInput } from "./types";

export async function saveOrderToSupabase(input: SaveOrderInput): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      status: "paid",
      total_usd: input.totalUsd,
      customer_email: input.customerEmail,
      // store gateway-specific reference in the appropriate column
      ...(input.gateway === "toss"
        ? { stripe_payment_intent_id: `toss_${input.gatewayRef}` }
        : { stripe_payment_intent_id: `lemon_${input.gatewayRef}` }),
      ...(input.appliedDiscountCode ? { applied_discount_code: input.appliedDiscountCode } : {}),
      ...(input.appliedReferralCode ? { applied_referral_code: input.appliedReferralCode } : {}),
      ...(input.customerNote ? { customer_note: input.customerNote } : {}),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error(`[${input.gateway}] saveOrder error:`, orderError);
    return null;
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price_usd: item.price_usd,
    }))
  );

  if (itemsError) {
    console.error(`[${input.gateway}] saveOrderItems error:`, itemsError);
  }

  return order.id as string;
}
