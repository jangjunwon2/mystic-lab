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
  pointsUsed?: number,
  pointsHoldRef?: string,
  referralCode?: string,
  couponCode?: string,
  ref?: string
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

  // LS custom 필드는 필드당 255자 제한. ref가 있으면 전체 장바구니는 서버측
  // pending_checkouts에 저장돼 있으므로 짧은 ref 하나만 넘긴다(항목 개수 무제한).
  // ref가 없으면(테이블 미배포 등 폴백) 압축 포맷으로 직접 싣는다(항목 4개까지).
  const custom: Record<string, string> = ref
    ? { ref }
    : {
        locale: payload.locale,
        order_items: JSON.stringify(
          payload.items.map((i) => ({ i: i.id, q: i.quantity, p: i.price_usd }))
        ),
        ...(discountCodeId ? { discount_code_id: discountCodeId } : {}),
        ...(discountCode ? { discount_code: discountCode } : {}),
        ...(referralCode ? { referral_code: referralCode } : {}),
        ...(couponCode ? { coupon_code: couponCode } : {}),
        ...(shippingMethod ? { shipping_method: shippingMethod } : {}),
        ...(shippingAddress ? { shipping_address: JSON.stringify(shippingAddress) } : {}),
        ...(pointsUsed && pointsUsed > 0 ? { points_used: String(pointsUsed) } : {}),
        ...(pointsHoldRef ? { points_hold_ref: pointsHoldRef } : {}),
      };

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
            custom,
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
    console.error("Lemon Squeezy checkout creation failed:", res.status);
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

  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
