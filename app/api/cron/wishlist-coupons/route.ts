import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runWishlistCoupons } from "@/lib/promotions";

// 일 1회 위시리스트 트리거 쿠폰 발급 (Vercel Cron → vercel.json). CRON_SECRET 보호.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = (await createAdminClient()) as any;
    const result = await runWishlistCoupons(admin);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron/wishlist-coupons]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
