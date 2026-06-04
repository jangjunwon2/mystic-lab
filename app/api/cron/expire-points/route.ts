import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// 일 1회 만료 포인트 정리 (Vercel Cron → vercel.json). 만료된 적립 로트의 잔량을 0으로,
// expire 트랜잭션으로 기록. (잔액 함수가 만료일로 이미 제외하므로 잔액 자체는 항상 정확하고,
//  본 잡은 감사 이력·정리용.)
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = (await createAdminClient()) as any;
    const { data, error } = await admin.rpc("expire_points");
    if (error) {
      console.error("[cron/expire-points]", error);
      return NextResponse.json({ error: "expire failed" }, { status: 500 });
    }
    return NextResponse.json({ expired: data ?? 0 });
  } catch (err) {
    console.error("[cron/expire-points]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
