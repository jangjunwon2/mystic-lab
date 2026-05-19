import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 }
    );
  }

  try {
    const stripe = new Stripe(stripeKey);
    const { items, locale, customerEmail } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: (items as CartItem[]).map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            metadata: { product_id: item.id, slug: item.slug },
          },
          unit_amount: Math.round(item.price_usd * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${siteUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${locale}/cart`,
      metadata: {
        locale,
        cart_json: JSON.stringify(
          (items as CartItem[]).map((i) => ({
            id: i.id,
            slug: i.slug,
            qty: i.quantity,
            price: i.price_usd,
          }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
