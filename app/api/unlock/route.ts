import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { generateSignedUrl } from "@/lib/cloudflare/stream";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

type UnlockCode = {
  id: string;
  product_id: string;
  first_used_at: string | null;
};

type SolutionVideoRow = {
  cloudflare_stream_id: string;
  title: string | null;
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const allowed = await checkRateLimit(`unlock:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { code, productId } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 4) {
      return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
    }

    const codeHash = createHash("sha256").update(trimmedCode).digest("hex");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    let codeQuery = supabase
      .from("product_unlock_codes")
      .select("id, product_id, first_used_at")
      .eq("code_hash", codeHash);

    if (productId) {
      codeQuery = codeQuery.eq("product_id", productId);
    }

    const { data: unlockCode, error } = await codeQuery.maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!unlockCode) {
      return NextResponse.json({ error: "Invalid code. Please check again." }, { status: 404 });
    }

    const uc = unlockCode as UnlockCode;

    // Get solution video
    const { data: solutionVideo } = await supabase
      .from("solution_videos")
      .select("cloudflare_stream_id, title")
      .eq("product_id", uc.product_id)
      .maybeSingle();

    const sv = solutionVideo as SolutionVideoRow | null;

    // Mark first use
    if (!uc.first_used_at) {
      await supabase
        .from("product_unlock_codes")
        .update({ first_used_at: new Date().toISOString() })
        .eq("id", uc.id);
    }

    // Generate signed URL if video exists
    const signedUrl = sv?.cloudflare_stream_id
      ? await generateSignedUrl(sv.cloudflare_stream_id)
      : null;

    // Set a 30-day session cookie so user doesn't have to re-enter the code
    const THIRTY_DAYS = 30 * 24 * 60 * 60;
    const response = NextResponse.json({
      success: true,
      productId: uc.product_id,
      signedUrl,
      videoTitle: sv?.title ?? null,
    });

    response.cookies.set(`ml_unlock_${uc.product_id}`, "granted", {
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
