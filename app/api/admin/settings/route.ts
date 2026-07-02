import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getPointEarnRate, setSetting, getSetting } from "@/lib/settings";
import { getSignupCouponConfig, getWishlistCouponConfig, getCartCouponConfig } from "@/lib/promotions";

// GET — 현재 설정값(포인트 적립률 + 가입 환영 쿠폰 + 위시리스트 트리거 쿠폰 + 사업자 고지 정보)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const pointEarnRate = await getPointEarnRate(supabase);
  const signupCoupon = await getSignupCouponConfig(supabase);
  const wishlistCoupon = await getWishlistCouponConfig(supabase);
  const cartCoupon = await getCartCouponConfig(supabase);

  const biz_name = await getSetting(supabase, "biz_name", process.env.BIZ_NAME || "비에이블 (Beable)");
  const biz_reg = await getSetting(supabase, "biz_reg", process.env.BIZ_REG || "742-10-02095");
  const biz_representative = await getSetting(supabase, "biz_representative", process.env.BIZ_REPRESENTATIVE || "장준원");
  const biz_address = await getSetting(supabase, "biz_address", process.env.BIZ_ADDRESS || "");
  const biz_phone = await getSetting(supabase, "biz_phone", process.env.BIZ_PHONE || "");
  const biz_email = await getSetting(supabase, "biz_email", process.env.BIZ_EMAIL || "jun923008@gmail.com");
  const biz_communication_reg = await getSetting(supabase, "biz_communication_reg", process.env.BIZ_COMMUNICATION_REG || "");
  const biz_privacy_officer = await getSetting(supabase, "biz_privacy_officer", process.env.BIZ_PRIVACY_OFFICER || "장준원 (jun923008@gmail.com)");

  const newsletter_percent = parseFloat(await getSetting(supabase, "newsletter_coupon_percent", "10"));
  const newsletterCoupon = {
    percent: Number.isFinite(newsletter_percent) ? newsletter_percent : 10,
  };

  return NextResponse.json({
    pointEarnRate,
    signupCoupon,
    wishlistCoupon,
    cartCoupon,
    newsletterCoupon,
    bizDetails: {
      biz_name,
      biz_reg,
      biz_representative,
      biz_address,
      biz_phone,
      biz_email,
      biz_communication_reg,
      biz_privacy_officer,
    },
  });
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

  // 위시리스트 트리거 쿠폰 설정
  if (body?.wishlistCoupon) {
    const { enabled, days, percent, months, name } = body.wishlistCoupon;
    const d = Number(days), p = Number(percent), m = Number(months);
    if (!Number.isInteger(d) || d <= 0 || d > 365) {
      return NextResponse.json({ error: "잔존 일수는 1~365 사이여야 합니다." }, { status: 400 });
    }
    if (!Number.isFinite(p) || p <= 0 || p > 100) {
      return NextResponse.json({ error: "할인율은 0~100% 사이여야 합니다." }, { status: 400 });
    }
    if (!Number.isInteger(m) || m <= 0 || m > 60) {
      return NextResponse.json({ error: "유효기간은 1~60개월 사이여야 합니다." }, { status: 400 });
    }
    const ok =
      (await setSetting(supabase, "wishlist_coupon_enabled", enabled ? "true" : "false")) &&
      (await setSetting(supabase, "wishlist_coupon_days", String(d))) &&
      (await setSetting(supabase, "wishlist_coupon_percent", String(p))) &&
      (await setSetting(supabase, "wishlist_coupon_months", String(m))) &&
      (await setSetting(supabase, "wishlist_coupon_name", String(name ?? "").slice(0, 60) || "위시리스트 특별 할인"));
    if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 장바구니 잔존 트리거 쿠폰 설정
  if (body?.cartCoupon) {
    const { enabled, days, percent, months, name } = body.cartCoupon;
    const d = Number(days), p = Number(percent), m = Number(months);
    if (!Number.isInteger(d) || d <= 0 || d > 365) {
      return NextResponse.json({ error: "잔존 일수는 1~365 사이여야 합니다." }, { status: 400 });
    }
    if (!Number.isFinite(p) || p <= 0 || p > 100) {
      return NextResponse.json({ error: "할인율은 0~100% 사이여야 합니다." }, { status: 400 });
    }
    if (!Number.isInteger(m) || m <= 0 || m > 60) {
      return NextResponse.json({ error: "유효기간은 1~60개월 사이여야 합니다." }, { status: 400 });
    }
    const ok =
      (await setSetting(supabase, "cart_coupon_enabled", enabled ? "true" : "false")) &&
      (await setSetting(supabase, "cart_coupon_days", String(d))) &&
      (await setSetting(supabase, "cart_coupon_percent", String(p))) &&
      (await setSetting(supabase, "cart_coupon_months", String(m))) &&
      (await setSetting(supabase, "cart_coupon_name", String(name ?? "").slice(0, 60) || "장바구니 특별 할인"));
    if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 사업자 정보 설정 저장
  if (body?.bizDetails) {
    const {
      biz_name,
      biz_reg,
      biz_representative,
      biz_address,
      biz_phone,
      biz_email,
      biz_communication_reg,
      biz_privacy_officer,
    } = body.bizDetails;

    const ok =
      (await setSetting(supabase, "biz_name", String(biz_name ?? "").trim())) &&
      (await setSetting(supabase, "biz_reg", String(biz_reg ?? "").trim())) &&
      (await setSetting(supabase, "biz_representative", String(biz_representative ?? "").trim())) &&
      (await setSetting(supabase, "biz_address", String(biz_address ?? "").trim())) &&
      (await setSetting(supabase, "biz_phone", String(biz_phone ?? "").trim())) &&
      (await setSetting(supabase, "biz_email", String(biz_email ?? "").trim())) &&
      (await setSetting(supabase, "biz_communication_reg", String(biz_communication_reg ?? "").trim())) &&
      (await setSetting(supabase, "biz_privacy_officer", String(biz_privacy_officer ?? "").trim()));

    if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 뉴스레터 구독 환영 쿠폰 설정
  if (body?.newsletterCoupon) {
    const { percent } = body.newsletterCoupon;
    const p = Number(percent);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      return NextResponse.json({ error: "할인율은 0~100% 사이여야 합니다." }, { status: 400 });
    }
    const ok = await setSetting(supabase, "newsletter_coupon_percent", String(p));
    if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true, newsletterCoupon: { percent: p } });
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
