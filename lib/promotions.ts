// 프로모션 — 자동 발급 쿠폰 규칙. v1: 가입 환영 쿠폰(회원당 1회·멱등).
// 설정은 site_settings(어드민 가변), 기본 10% / 6개월. issued_coupons·기존 멱등 primitive 재사용.

import { getSetting } from "@/lib/settings";
import { issueCoupon, hasCouponFromSource } from "@/lib/coupons";
import { sendCouponEmail } from "@/lib/resend";

export const SIGNUP_COUPON_DEFAULT_PERCENT = 10;
export const SIGNUP_COUPON_DEFAULT_MONTHS = 6;

export interface SignupCouponConfig {
  enabled: boolean;
  percent: number;
  months: number;
}

// 가입 환영 쿠폰 설정 — site_settings(미설정 시 기본값). 값이 유효하지 않으면 기본값으로 폴백.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSignupCouponConfig(admin: any): Promise<SignupCouponConfig> {
  const enabled = (await getSetting(admin, "signup_coupon_enabled", "true")) !== "false";
  const p = parseFloat(await getSetting(admin, "signup_coupon_percent", String(SIGNUP_COUPON_DEFAULT_PERCENT)));
  const m = parseInt(await getSetting(admin, "signup_coupon_months", String(SIGNUP_COUPON_DEFAULT_MONTHS)), 10);
  return {
    enabled,
    percent: Number.isFinite(p) && p > 0 && p <= 100 ? p : SIGNUP_COUPON_DEFAULT_PERCENT,
    months: Number.isFinite(m) && m > 0 && m <= 60 ? m : SIGNUP_COUPON_DEFAULT_MONTHS,
  };
}

// 가입 환영 쿠폰 발급 — 회원당 1회(source='signup' 멱등). 발급 성공 시 안내 이메일(best-effort).
// 최초 인증 접근(마이페이지·결제 등) 시 보장 호출. 실패는 무시(다음 호출 때 재시도).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function grantSignupCoupon(admin: any, userId: string | null, email: string | null): Promise<void> {
  if (!userId && !email) return;
  try {
    const cfg = await getSignupCouponConfig(admin);
    if (!cfg.enabled) return;
    if (await hasCouponFromSource(admin, { userId, email, source: "signup" })) return;

    const code = await issueCoupon(admin, {
      userId,
      email,
      type: "percent",
      value: cfg.percent,
      source: "signup",
      expiresMonths: cfg.months,
    });
    if (code && email) {
      await sendCouponEmail({ to: email, code, type: "percent", value: cfg.percent }).catch(() => {});
    }
  } catch {
    /* 발급 실패는 무시 */
  }
}
