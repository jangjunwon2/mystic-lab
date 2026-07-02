import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { userOwnsProduct } from "@/lib/product-access";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ authorized: false });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = (await createAdminClient()) as any;

    // 1. Fetch product by slug
    const { data: product } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ authorized: false });
    }

    // 2. Read cookie
    const cookieName = slug === "magic-calculator" ? "ml_calc_device_token" : `ml_dt_${product.id}`;
    const token = request.cookies.get(cookieName)?.value;

    if (token) {
      const tokenHash = createHash("sha256").update(token).digest("hex");

      // Verify active token hash
      const { data: activeCode } = await admin
        .from("product_unlock_codes")
        .select("id")
        .eq("active_token_hash", tokenHash)
        .eq("product_id", product.id)
        .maybeSingle();

      if (activeCode) {
        return NextResponse.json({ authorized: true });
      }
    }

    // 3. Cookie missing or invalid: Try auto-activation if logged in and owns product
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const owns = await userOwnsProduct(admin, user.id, product.id);
        if (owns) {
          // Find code assigned to user
          const { data: code } = await admin
            .from("product_unlock_codes")
            .select("id, is_locked, activation_count, max_activations, last_activated_at")
            .eq("product_id", product.id)
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          if (code && !code.is_locked) {
            const maxActivations = code.max_activations;
            const activationCount = code.activation_count ?? 0;
            const lastActivated = code.last_activated_at ? new Date(code.last_activated_at) : null;
            const isRecent = lastActivated && (Date.now() - lastActivated.getTime() < 24 * 60 * 60 * 1000);

            // Bypasses limit if recent activation, else check activation limit
            if (maxActivations == null || activationCount < maxActivations || isRecent) {
              const nextActivationCount = isRecent ? activationCount : activationCount + 1;
              const newDeviceToken = randomBytes(32).toString("hex");
              const newDeviceTokenHash = createHash("sha256").update(newDeviceToken).digest("hex");

              // Update DB
              const { error: updateError } = await admin
                .from("product_unlock_codes")
                .update({
                  active_token_hash: newDeviceTokenHash,
                  last_activated_at: new Date().toISOString(),
                  activation_count: nextActivationCount,
                })
                .eq("id", code.id);

              if (!updateError) {
                const response = NextResponse.json({ authorized: true, deviceToken: newDeviceToken, productId: product.id });
                const cookieOpts = {
                  maxAge: 30 * 24 * 60 * 60,
                  httpOnly: false, // client-side can restore it
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "lax" as const,
                  path: "/",
                };

                response.cookies.set(`ml_unlock_${product.id}`, "granted", { ...cookieOpts, httpOnly: true });
                response.cookies.set(`ml_dt_${product.id}`, newDeviceToken, cookieOpts);
                if (slug === "magic-calculator") {
                  response.cookies.set("ml_calc_device_token", newDeviceToken, cookieOpts);
                }

                return response;
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ authorized: false });
  } catch {
    return NextResponse.json({ authorized: false });
  }
}
