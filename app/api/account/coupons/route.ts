import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAccountCouponsData } from "@/lib/coupons";
import { checkRateLimit } from "@/lib/rate-limit";

// GET — 로그인 회원의 사용가능 개인 쿠폰 목록
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  if (!(await checkRateLimit(`account-coupons:${user.id}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const data = await getAccountCouponsData(admin, user.id, user.email ?? null);

  return NextResponse.json(data);
}
