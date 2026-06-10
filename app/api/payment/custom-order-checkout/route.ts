import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUsdToKrw } from "@/lib/payments/exchange-rate";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  if (!(await checkRateLimit(`custom-order-checkout:${getClientIP(req)}`, 10, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  const { data: order } = await admin
    .from("custom_order_requests")
    .select("id, name, email, quoted_price_usd, quoted_price_krw, payment_status")
    .eq("payment_token", token)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Invalid token." }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ error: "Already paid." }, { status: 409 });
  if (!order.quoted_price_usd) return NextResponse.json({ error: "No price set." }, { status: 400 });

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;
  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json({ error: "LemonSqueezy not configured." }, { status: 503 });
  }

  const krwRate = await getUsdToKrw();
  const amountKrw = order.quoted_price_krw ?? Math.round(order.quoted_price_usd * krwRate);
  const amountCents = amountKrw * 100;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: { embed: false, media: false, logo: true },
          checkout_data: {
            email: order.email,
            custom: { custom_order_token: token },
          },
          product_options: {
            name: "Mystic Lab Custom Order",
            description: `Custom Order — $${Number(order.quoted_price_usd).toFixed(2)}`,
            redirect_url: `${siteUrl}/en/custom-order/pay/${token}?ls_success=1`,
            receipt_button_text: "Back to Mystic Lab",
            receipt_link_url: `${siteUrl}/en/account`,
          },
          custom_price: amountCents,
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[custom-order-checkout] LS error:", err);
    return NextResponse.json({ error: "LemonSqueezy checkout creation failed." }, { status: 502 });
  }

  const json = await res.json();
  return NextResponse.json({ url: json.data.attributes.url });
}
