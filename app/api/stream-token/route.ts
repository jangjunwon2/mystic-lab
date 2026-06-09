import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSignedUrl } from "@/lib/cloudflare/stream";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

/**
 * POST /api/stream-token
 * Body: { stream_id: string; product_id: string }
 *
 * Access tiers:
 *  1. Admin → always allowed
 *  2. Authenticated user who purchased the product
 *  3. Non-authenticated user with device-code cookie for this product
 *
 * Returns: { url: string }  (signed Cloudflare Stream iframe URL)
 */
export async function POST(request: Request) {
  if (!(await checkRateLimit(`stream-token:${getClientIP(request as Parameters<typeof getClientIP>[0])}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { stream_id, product_id } = await request.json().catch(() => ({}));

  if (!stream_id || !product_id) {
    return NextResponse.json({ error: "stream_id and product_id are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let authorized = false;

  if (user) {
    // Check admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if ((profile as { role?: string } | null)?.role === "admin") {
      authorized = true;
    }

    // Check purchase
    if (!authorized) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orderItem } = await (supabase as any)
        .from("order_items")
        .select("id, orders!inner(user_id, status)")
        .eq("product_id", product_id)
        .eq("orders.user_id", user.id)
        .in("orders.status", ["paid", "shipped", "completed"])
        .limit(1)
        .maybeSingle();

      if (orderItem) authorized = true;
    }
  }

  // Device code session cookie check
  if (!authorized) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`ml_unlock_${product_id}`);
    if (sessionCookie?.value === "granted") authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = await generateSignedUrl(stream_id);
  return NextResponse.json({ url });
}
