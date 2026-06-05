import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { findUsableCoupon } from "@/lib/coupons";

export async function POST(request: NextRequest) {
  // 코드 브루트포스 방지 — IP당 분당 10회
  if (!(await checkRateLimit(`discount-validate:${getClientIP(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const { code, totalUsd, items } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "코드를 입력해주세요." }, { status: 400 });
  }

  const codeUpper = code.toUpperCase().trim();
  const subtotal = typeof totalUsd === "number" ? totalUsd : 0;

  // 상품/카테고리 한정 쿠폰의 '해당 상품 소계' 산출용 — 클라이언트 단가(미리보기). 결제 시 서버 재계산으로 확정.
  const lineTotalsByProduct = new Map<string, number>();
  if (Array.isArray(items)) {
    for (const it of items as { id?: string; price_usd?: number; quantity?: number }[]) {
      if (!it?.id) continue;
      const line = (Number(it.price_usd) || 0) * Math.max(1, Math.trunc(Number(it.quantity) || 1));
      lineTotalsByProduct.set(it.id, (lineTotalsByProduct.get(it.id) ?? 0) + line);
    }
  }

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
      code: codeUpper, userId, email: userEmail, subtotalUsd: subtotal, lineTotalsByProduct,
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

  return NextResponse.json({ error: "유효하지 않은 할인 코드입니다." }, { status: 404 });
}
