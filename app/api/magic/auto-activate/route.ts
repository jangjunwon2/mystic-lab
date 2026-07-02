import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { userOwnsProduct } from "@/lib/product-access";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const next = searchParams.get("next") ?? "/";

  if (!slug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = (await createAdminClient()) as any;

    // 1. Fetch product by slug
    const { data: product } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!product) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 2. Verify ownership
    const owns = await userOwnsProduct(admin, user.id, product.id);
    if (!owns) {
      return NextResponse.redirect(new URL(`/products/${slug}`, request.url));
    }

    // 3. Find or create code assigned to user
    const { data: code } = await admin
      .from("product_unlock_codes")
      .select("id, is_locked, activation_count, max_activations, last_activated_at")
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (code) {
      if (code.is_locked) {
        // Locked by admin, cannot activate
        return NextResponse.redirect(new URL(`/products/${slug}?error=locked`, request.url));
      }

      const maxActivations = code.max_activations;
      const activationCount = code.activation_count ?? 0;
      
      const lastActivated = code.last_activated_at ? new Date(code.last_activated_at) : null;
      const isRecent = lastActivated && (Date.now() - lastActivated.getTime() < 24 * 60 * 60 * 1000);
      
      // If activation limit exceeded, check if we are already recent
      if (maxActivations != null && activationCount >= maxActivations && !isRecent) {
        return NextResponse.redirect(new URL(`/products/${slug}?error=limit_exceeded`, request.url));
      }

      const nextActivationCount = isRecent ? activationCount : activationCount + 1;

      // Generate device token
      const deviceToken = randomBytes(32).toString("hex");
      const newDeviceTokenHash = createHash("sha256").update(deviceToken).digest("hex");

      // Update DB
      const { error: updateError } = await admin
        .from("product_unlock_codes")
        .update({
          active_token_hash: newDeviceTokenHash,
          last_activated_at: new Date().toISOString(),
          activation_count: nextActivationCount,
        })
        .eq("id", code.id);

      if (updateError) {
        return NextResponse.redirect(new URL(`/products/${slug}`, request.url));
      }

      // Set cookies and redirect
      const response = NextResponse.redirect(new URL(next, request.url));
      const cookieOpts = {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      response.cookies.set(`ml_unlock_${product.id}`, "granted", cookieOpts);
      response.cookies.set(`ml_dt_${product.id}`, deviceToken, cookieOpts);
      if (slug === "magic-calculator") {
        response.cookies.set("ml_calc_device_token", deviceToken, cookieOpts);
      }

      return response;
    }

    // If no code exists (which shouldn't happen because userOwnsProduct returned true, meaning order exists)
    // we redirect to the product detail page which has MagicMemberAccess that will auto-generate code and activate.
    return NextResponse.redirect(new URL(`/products/${slug}`, request.url));
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
