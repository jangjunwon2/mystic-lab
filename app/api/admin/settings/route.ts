import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getPointEarnRate, setSetting } from "@/lib/settings";
import { getSignupCouponConfig } from "@/lib/promotions";

// GET — 현재 설정값(포인트 적립률 + 가입 환영 쿠폰)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const pointEarnRate = await getPointEarnRate(supabase);
  const signupCoupon = await getSignupCouponConfig(supabase);
  return NextResponse.json({ pointEarnRate, signupCoupon });
}

// POST — 설정 저장. body { pointEarnRate? } 또는 { signupCoupon: { enabled, percent, months } }
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const supabase = await createAdminClient();

  // 가입 환영 쿠폰 설정
  if (body?.signupCoupon) {
    const { enabled, percent, months } = body.signupCoupon;
    const p = Number(percent);
    const m = Number(months);
    if (!Number.isFinite(p) || p <= 0 || p > 100) {
      return NextResponse.json({ error: "할인율은 0~100% 사이여야 합니다." }, { status: 400 });
    }
    if (!Number.isInteger(m) || m <= 0 || m > 60) {
      return NextResponse.json({ error: "유효기간은 1~60개월 사이여야 합니다." }, { status: 400 });
    }
    const ok =
      (await setSetting(supabase, "signup_coupon_enabled", enabled ? "true" : "false")) &&
      (await setSetting(supabase, "signup_coupon_percent", String(p))) &&
      (await setSetting(supabase, "signup_coupon_months", String(m)));
    if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true, signupCoupon: { enabled: !!enabled, percent: p, months: m } });
  }

  // 포인트 적립률 설정
  const rate = Number(body?.pointEarnRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    return NextResponse.json({ error: "적립률은 0~1 사이여야 합니다." }, { status: 400 });
  }
  const ok = await setSetting(supabase, "point_earn_rate", String(rate));
  if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, pointEarnRate: rate });
}
