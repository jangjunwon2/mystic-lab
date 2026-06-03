import type { OrderPayload } from "./types";

interface LemonCheckoutResponse {
  data: {
    id: string;
    attributes: {
      url: string;
    };
  };
}

/**
 * Creates a Lemon Squeezy checkout session and returns the checkout URL.
 * The URL is opened as an overlay in the browser via LemonSqueezy.Url.Open().
 *
 * Prerequisites:
 *  - Create a product in your Lemon Squeezy store with "Pay what you want" enabled
 *  - Set LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_VARIANT_ID
 */
export async function createLemonCheckout(
  payload: OrderPayload,
  amountCents: number,
  discountCodeId?: string,
  discountCode?: string,
  shippingMethod?: string,
  shippingAddress?: Record<string, string>,
  pointsUsed?: number
): Promise<string> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy environment variables are not configured.");
  }

  const orderName = payload.items
    .map((i) => `${i.name} x${i.quantity}`)
    .join(", ");

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
          checkout_options: {
            embed: true,
            media: false,
            logo: true,
          },
          checkout_data: {
            email: payload.customerEmail,
            custom: {
              locale: payload.locale,
              order_items: JSON.stringify(
                payload.items.map((i) => ({
                  id: i.id,
                  slug: i.slug,
                  qty: i.quantity,
                  price: i.price_usd,
                }))
              ),
              ...(discountCodeId ? { discount_code_id: discountCodeId } : {}),
              ...(discountCode ? { discount_code: discountCode } : {}),
              ...(shippingMethod ? { shipping_method: shippingMethod } : {}),
              ...(shippingAddress ? { shipping_address: JSON.stringify(shippingAddress) } : {}),
              ...(pointsUsed && pointsUsed > 0 ? { points_used: String(pointsUsed) } : {}),
            },
          },
          product_options: {
            name: "Mystic Lab Order",
            description: orderName,
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${payload.locale}/checkout/success?gateway=lemon`,
            receipt_button_text: "View at Mystic Lab",
            receipt_link_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${payload.locale}/account`,
          },
          // Custom price in cents — requires the variant to have "Pay what you want" enabled
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
    console.error("Lemon Squeezy checkout creation failed:", err);
    // Parse API error for more actionable message
    let detail = "";
    try {
      const parsed = JSON.parse(err);
      const firstError = parsed?.errors?.[0];
      if (firstError) detail = ` — ${firstError.title ?? ""}: ${firstError.detail ?? ""}`.trim();
    } catch { /* ignore parse error */ }
    throw new Error(`Lemon Squeezy API error${detail}`);
  }

  const json: LemonCheckoutResponse = await res.json();
  return json.data.attributes.url;
}

/**
 * Verifies a Lemon Squeezy webhook signature.
 * Uses HMAC-SHA256 with LEMON_SQUEEZY_WEBHOOK_SECRET.
 */
export async function verifyLemonWebhook(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const { createHmac } = await import("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}
