import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { findUsableCoupon } from "@/lib/coupons";

export async function POST(request: NextRequest) {
  // 코드 브루트포스 방지 — IP당 분당 10회
  if (!(await checkRateLimit(`discount-validate:${getClientIP(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const { code, totalUsd } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "코드를 입력해주세요." }, { status: 400 });
  }

  const codeUpper = code.toUpperCase().trim();
  const subtotal = typeof totalUsd === "number" ? totalUsd : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // 1) 통합 쿠폰(issued_coupons) — 공개형(비로그인 허용·다회) + 개인형(로그인 소유자·1회).
  //    구 discount_codes 는 마이그레이션 037에서 공개 쿠폰으로 백필됨 → 여기서 처리된다.
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const auth = await createClient();
      const { data: { user } } = await auth.auth.getUser();
      if (user) { userId = user.id; userEmail = user.email ?? null; }
    } catch { /* 비로그인 — 공개 쿠폰만 매칭 */ }

    const coupon = await findUsableCoupon(supabase, {
      code: codeUpper, userId, email: userEmail, subtotalUsd: subtotal,
    });
    if (coupon) {
      return NextResponse.json({
        valid: true,
        kind: "coupon",
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: coupon.discountAmount,
      });
    }
  } catch { /* 폴백으로 진행 */ }

  // 2) 레퍼럴(제휴) 코드 — 신규 구매자 할인(정률/정액). 사용횟수·추천인 보상은 save-order에서 처리.
  const { data: referral } = await supabase
    .from("referral_codes")
    .select("id, code, discount_percent, discount_type")
    .eq("code", codeUpper)
    .eq("is_active", true)
    .maybeSingle();

  if (referral) {
    const r = referral as { id: string; code: string; discount_percent: number; discount_type: string | null };
    const isFixed = r.discount_type === "fixed";
    const discountAmount = isFixed
      ? Math.min(r.discount_percent, subtotal)
      : Math.round(subtotal * (r.discount_percent / 100) * 100) / 100;
    return NextResponse.json({
      valid: true,
      kind: "referral",
      id: r.id,
      code: r.code,
      type: isFixed ? "fixed" : "percent",
      value: r.discount_percent,
      discountAmount,
    });
  }

  // 3) 레거시 할인 코드(discount_codes) 폴백 — 037 백필 후엔 보통 (1)에서 잡히지만,
  //    미이관/롤백 상황을 위한 후방호환 경로. 사용횟수는 save-order에서 increment_discount_used 처리.
  const { data: legacy } = await supabase
    .from("discount_codes")
    .select("id, code, type, value, max_uses, used_count, expires_at")
    .eq("code", codeUpper)
    .eq("is_active", true)
    .maybeSingle();

  if (legacy) {
    const row = legacy as {
      id: string;
      code: string;
      type: "percent" | "fixed";
      value: number;
      max_uses: number | null;
      used_count: number;
      expires_at: string | null;
    };

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: "만료된 할인 코드입니다." }, { status: 400 });
    }
    if (row.max_uses !== null && row.used_count >= row.max_uses) {
      return NextResponse.json({ error: "사용 한도가 초과된 코드입니다." }, { status: 400 });
    }

    const discountAmount =
      row.type === "percent"
        ? Math.round(subtotal * (row.value / 100) * 100) / 100
        : Math.min(row.value, subtotal);

    return NextResponse.json({
      valid: true,
      kind: "discount",
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value,
      discountAmount,
    });
  }

  return NextResponse.json({ error: "유효하지 않은 할인 코드입니다." }, { status: 404 });
}
