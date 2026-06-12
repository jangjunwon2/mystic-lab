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

export const WISHLIST_COUPON_DEFAULT_DAYS = 7;
export const WISHLIST_COUPON_DEFAULT_PERCENT = 10;
export const WISHLIST_COUPON_DEFAULT_MONTHS = 1;
export const WISHLIST_COUPON_DEFAULT_NAME = "위시리스트 특별 할인";

export interface WishlistCouponConfig {
  enabled: boolean;
  days: number;     // 위시리스트 잔존 일수 임계
  percent: number;
  months: number;   // 발급 쿠폰 유효기간(개월)
  name: string;
}

// 위시리스트 트리거 쿠폰 설정 — site_settings(미설정 시 기본). 기본 OFF(운영자가 켜야 동작).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWishlistCouponConfig(admin: any): Promise<WishlistCouponConfig> {
  const enabled = (await getSetting(admin, "wishlist_coupon_enabled", "false")) === "true";
  const days = parseInt(await getSetting(admin, "wishlist_coupon_days", String(WISHLIST_COUPON_DEFAULT_DAYS)), 10);
  const percent = parseFloat(await getSetting(admin, "wishlist_coupon_percent", String(WISHLIST_COUPON_DEFAULT_PERCENT)));
  const months = parseInt(await getSetting(admin, "wishlist_coupon_months", String(WISHLIST_COUPON_DEFAULT_MONTHS)), 10);
  const name = (await getSetting(admin, "wishlist_coupon_name", WISHLIST_COUPON_DEFAULT_NAME)) || WISHLIST_COUPON_DEFAULT_NAME;
  return {
    enabled,
    days: Number.isFinite(days) && days > 0 && days <= 365 ? days : WISHLIST_COUPON_DEFAULT_DAYS,
    percent: Number.isFinite(percent) && percent > 0 && percent <= 100 ? percent : WISHLIST_COUPON_DEFAULT_PERCENT,
    months: Number.isFinite(months) && months > 0 && months <= 60 ? months : WISHLIST_COUPON_DEFAULT_MONTHS,
    name,
  };
}

// ─── 장바구니 잔존 트리거 쿠폰 ───────────────────────────────────────────────

export const CART_COUPON_DEFAULT_DAYS = 3;
export const CART_COUPON_DEFAULT_PERCENT = 15;
export const CART_COUPON_DEFAULT_MONTHS = 1;
export const CART_COUPON_DEFAULT_NAME = "장바구니 특별 할인";

export interface CartCouponConfig {
  enabled: boolean;
  days: number;     // 미갱신(장바구니 미방문) 임계 일수
  percent: number;
  months: number;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCartCouponConfig(admin: any): Promise<CartCouponConfig> {
  const enabled = (await getSetting(admin, "cart_coupon_enabled", "false")) === "true";
  const days = parseInt(await getSetting(admin, "cart_coupon_days", String(CART_COUPON_DEFAULT_DAYS)), 10);
  const percent = parseFloat(await getSetting(admin, "cart_coupon_percent", String(CART_COUPON_DEFAULT_PERCENT)));
  const months = parseInt(await getSetting(admin, "cart_coupon_months", String(CART_COUPON_DEFAULT_MONTHS)), 10);
  const name = (await getSetting(admin, "cart_coupon_name", CART_COUPON_DEFAULT_NAME)) || CART_COUPON_DEFAULT_NAME;
  return {
    enabled,
    days: Number.isFinite(days) && days > 0 && days <= 365 ? days : CART_COUPON_DEFAULT_DAYS,
    percent: Number.isFinite(percent) && percent > 0 && percent <= 100 ? percent : CART_COUPON_DEFAULT_PERCENT,
    months: Number.isFinite(months) && months > 0 && months <= 60 ? months : CART_COUPON_DEFAULT_MONTHS,
    name,
  };
}

interface TriggerCouponRunConfig {
  enabled: boolean;
  days: number;
  percent: number;
  months: number;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runTriggerCoupons(admin: any, cfg: TriggerCouponRunConfig, opts: {
  table: string; dateCol: string; source: string;
}): Promise<{ issued: number }> {
  if (!cfg.enabled) return { issued: 0 };
  const cutoff = new Date(Date.now() - cfg.days * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await admin.from(opts.table).select("user_id, product_id").lte(opts.dateCol, cutoff).limit(500);
  const items = (rows ?? []) as { user_id: string; product_id: string }[];
  if (items.length === 0) return { issued: 0 };

  const userIds = [...new Set(items.map((r) => r.user_id))];
  const { data: existing } = await admin
    .from("issued_coupons").select("id, user_id")
    .eq("source", opts.source).eq("is_used", false).eq("is_active", true).in("user_id", userIds);
  const existRows = (existing ?? []) as { id: string; user_id: string }[];
  const covered = new Set<string>();
  if (existRows.length > 0) {
    const byCoupon = new Map(existRows.map((e) => [e.id, e.user_id]));
    const { data: cps } = await admin.from("coupon_products").select("coupon_id, product_id").in("coupon_id", existRows.map((e) => e.id));
    for (const cp of (cps ?? []) as { coupon_id: string; product_id: string }[]) {
      const uid = byCoupon.get(cp.coupon_id);
      if (uid) covered.add(`${uid}:${cp.product_id}`);
    }
  }

  // 루프 전에 고유 user_id 배치 조회 — 루프 내 getUserById N+1 방지
  const uniqueUserIds = [...new Set(items.map((r) => r.user_id))];
  const idToEmail = new Map<string, string>();
  try {
    let page = 1;
    while (true) {
      const { data: batch } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      const users = (batch?.users ?? []) as { id: string; email?: string }[];
      for (const u of users) {
        if (uniqueUserIds.includes(u.id) && u.email) idToEmail.set(u.id, u.email);
      }
      if (users.length < 1000) break;
      page++;
    }
  } catch { /* 이메일 조회 실패 시 발급은 계속 — email null로 진행 */ }

  let issued = 0;
  for (const r of items) {
    const key = `${r.user_id}:${r.product_id}`;
    if (covered.has(key)) continue;
    covered.add(key);
    const email = idToEmail.get(r.user_id) ?? null;
    const code = await issueCoupon(admin, {
      userId: r.user_id, email, type: "percent", value: cfg.percent,
      source: opts.source, expiresMonths: cfg.months, productIds: [r.product_id], name: cfg.name,
    });
    if (code) {
      issued++;
      if (email) await sendCouponEmail({ to: email, code, type: "percent", value: cfg.percent }).catch(() => {});
    }
  }
  return { issued };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runCartCoupons(admin: any): Promise<{ issued: number }> {
  const cfg = await getCartCouponConfig(admin);
  return runTriggerCoupons(admin, cfg, { table: "cart_items", dateCol: "synced_at", source: "cart_trigger" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runWishlistCoupons(admin: any): Promise<{ issued: number }> {
  const cfg = await getWishlistCouponConfig(admin);
  return runTriggerCoupons(admin, cfg, { table: "wishlists", dateCol: "created_at", source: "trigger" });
}
