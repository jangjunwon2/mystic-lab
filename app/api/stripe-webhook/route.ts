import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const cartJson = session.metadata?.cart_json;
    const cartItems: { id: string; slug: string; qty: number; price: number }[] =
      cartJson ? JSON.parse(cartJson) : [];

    if (cartItems.length === 0) return;

    const totalUsd = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "paid",
        total_usd: totalUsd,
        stripe_payment_intent_id: session.payment_intent as string,
        customer_email: session.customer_email ?? "",
        shipping_address: null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return;
    }

    // Create order items
    const { error: itemsError } = await supabase.from("order_items").insert(
      cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.qty,
        price_usd: item.price,
      }))
    );

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
    }
  } catch (err) {
    console.error("handleCheckoutCompleted error:", err);
  }
}
