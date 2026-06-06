import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runCartCoupons } from "@/lib/promotions";

// CRON_SECRET으로 보호. vercel.json: "0 20 * * *" (매일 20시 UTC)
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { issued } = await runCartCoupons(admin);
  return NextResponse.json({ ok: true, issued });
}
