import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPointsBalance, grantSignupBonus } from "@/lib/points";
import { grantSignupCoupon } from "@/lib/promotions";

// GET — 로그인 회원의 포인트 잔액 + 최근 내역
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  // 가입 환영 적립·쿠폰 — 최초 1회(멱등). 체크아웃·계정 진입 시 보장.
  await grantSignupBonus(admin, user.id);
  await grantSignupCoupon(admin, user.id, user.email ?? null);
  const balance = await getPointsBalance(admin, user.id);

  const { data: history } = await admin
    .from("point_transactions")
    .select("id, amount, type, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ balance, history: history ?? [] });
}
