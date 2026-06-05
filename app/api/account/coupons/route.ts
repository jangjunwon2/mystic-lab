import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { grantSignupCoupon } from "@/lib/promotions";

// GET — 로그인 회원의 사용가능 개인 쿠폰 목록. 진입 시 가입 환영 쿠폰을 멱등 보장 발급.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  // 가입 환영 쿠폰 — 최초 1회(멱등). 쿠폰 탭 진입 시 보장.
  await grantSignupCoupon(admin, user.id, user.email ?? null);

  const email = user.email?.toLowerCase() ?? "";
  const nowIso = new Date().toISOString();

  // 소유자(user_id 또는 이메일)·미사용·미만료 개인 쿠폰. (공개 쿠폰은 '소유' 개념이 없어 제외)
  const { data } = await admin
    .from("issued_coupons")
    .select("id, code, type, value, source, min_order_usd, expires_at, created_at")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .neq("scope", "public")
    .eq("is_used", false)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ coupons: data ?? [] });
}
