import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAccountPointsData } from "@/lib/points";
import { checkRateLimit } from "@/lib/rate-limit";

// GET — 로그인 회원의 포인트 잔액 + 최근 내역
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  if (!(await checkRateLimit(`account-points:${user.id}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const data = await getAccountPointsData(admin, user.id);

  return NextResponse.json(data);
}
