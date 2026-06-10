interface TossConfirmResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
}

/**
 * Confirms a Toss Payments payment by calling their /v1/payments/confirm API.
 * Must be called server-side using the secret key.
 *
 * When PortOne integration is needed, swap this function with a PortOne adapter
 * that calls the same endpoint via PortOne's proxy.
 */
export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; data?: TossConfirmResponse; error?: string }> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    return { success: false, error: "Toss secret key is not configured." };
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Toss confirm failed:", { code: (data as Record<string, unknown>).code, message: (data as Record<string, unknown>).message });
    return { success: false, error: data.message ?? "Payment confirmation failed." };
  }

  return { success: true, data: data as TossConfirmResponse };
}

/** KRW conversion rate — update periodically or replace with a live FX API */
export const USD_TO_KRW = 1380;

export function usdToKrw(usd: number, rate = USD_TO_KRW): number {
  return Math.round(usd * rate);
}
