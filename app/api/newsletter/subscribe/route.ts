import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { issueCoupon, hasCouponFromSource } from "@/lib/coupons";

export async function POST(request: NextRequest) {
  // 스팸 방지 — IP당 시간당 5회
  if (!(await checkRateLimit(`newsletter:${getClientIP(request)}`, 5, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests. Please try later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { email, locale, source } = body as {
    email: string;
    locale?: string;
    source?: string;
  };

  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("newsletter_subscribers")
    .upsert(
      {
        email: trimmed,
        locale: locale ?? "en",
        is_active: true,
        source: source ?? "footer",
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    );

  if (error) return NextResponse.json({ error: "Subscription failed. Please try again." }, { status: 500 });

  // 환영 쿠폰 자동발급 — 설정 newsletter_coupon_percent(%, 0이면 비활성). 이메일당 1회.
  let welcomeCoupon: string | null = null;
  try {
    const pct = parseFloat(await getSetting(supabase, "newsletter_coupon_percent", "10"));
    if (Number.isFinite(pct) && pct > 0) {
      const already = await hasCouponFromSource(supabase, { email: trimmed, source: "newsletter" });
      if (!already) {
        // 로그인 상태면 user_id도 연결
        let userId: string | null = null;
        try {
          const auth = await createClient();
          const { data: { user } } = await auth.auth.getUser();
          if (user?.email?.toLowerCase() === trimmed) userId = user.id;
        } catch { /* 비로그인 */ }
        welcomeCoupon = await issueCoupon(supabase, {
          userId, email: trimmed, type: "percent", value: pct, source: "newsletter", expiresMonths: 6,
        });
      }
    }
  } catch { /* 발급 실패는 구독에 영향 없음 */ }

  return NextResponse.json({ ok: true, welcomeCoupon });
}
