// 개인 발급 쿠폰(issued_coupons) — 발급·검증·사용 처리. service-role(admin client)로 접근.
// 공용 할인코드(discount_codes)와 별개: 특정 회원/이메일에게 1회용으로 지급.
import { randomBytes } from "crypto";

const round2 = (n: number) => Math.round(n * 100) / 100;

// 혼동되는 글자(0/O, 1/I) 제외
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(prefix = "ML"): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_CHARS[randomBytes(1)[0] % CODE_CHARS.length];
  return `${prefix}-${s}`;
}

export interface IssueCouponParams {
  userId?: string | null;
  email?: string | null;
  type: "percent" | "fixed";
  value: number; // % 또는 $
  source: string; // 'newsletter' | 'referral' | 'manual' | 'promo' | 'signup'
  minOrderUsd?: number;
  expiresMonths?: number | null; // null = 무기한 (기본 6개월)
  productIds?: string[];         // 한정 상품(비어있으면 전체)
  categories?: string[];         // 한정 카테고리(비어있으면 전체)
  name?: string | null;          // 쿠폰 이름(명목) — 고객 노출용
}

// 쿠폰 발급(유니크 코드 생성·재시도). 성공 시 발급 코드 반환.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function issueCoupon(admin: any, params: IssueCouponParams): Promise<string | null> {
  if (!params.value || params.value <= 0) return null;
  if (!params.userId && !params.email) return null;
  const months = params.expiresMonths === undefined ? 6 : params.expiresMonths;
  const expiresAt = months == null ? null : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const { data, error } = await admin.from("issued_coupons").insert({
      code,
      user_id: params.userId ?? null,
      email: params.email ? params.email.toLowerCase() : null,
      type: params.type,
      value: params.value,
      source: params.source,
      min_order_usd: params.minOrderUsd ?? 0,
      expires_at: expiresAt,
      name: params.name?.trim() || null,
    }).select("id").single();
    if (!error && data) {
      await insertCouponTargets(admin, data.id, params.productIds, params.categories);
      return code;
    }
    // 코드 충돌 외 오류면 중단
    if (!String(error?.message ?? "").toLowerCase().includes("duplicate")) return null;
  }
  return null;
}

// 같은 소스로 이미 발급받았는지(중복 발급 방지 — 예: 뉴스레터 환영 1회).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function hasCouponFromSource(admin: any, opts: { userId?: string | null; email?: string | null; source: string }): Promise<boolean> {
  let q = admin.from("issued_coupons").select("id").eq("source", opts.source).limit(1);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  else if (opts.email) q = q.eq("email", opts.email.toLowerCase());
  else return false;
  const { data } = await q.maybeSingle();
  return !!data;
}

export interface UsableCoupon {
  id: string;
  code: string;
  name: string | null;
  type: "percent" | "fixed";
  value: number;
  discountAmount: number;
}

// 쿠폰의 상품/카테고리 한정 대상 로드. 둘 다 비어있으면 전체 적용(한정 없음).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCouponTargets(admin: any, couponId: string): Promise<{ productIds: Set<string>; categories: Set<string> }> {
  const [prodRes, catRes] = await Promise.all([
    admin.from("coupon_products").select("product_id").eq("coupon_id", couponId),
    admin.from("coupon_categories").select("category").eq("coupon_id", couponId),
  ]);
  const productIds = new Set<string>(((prodRes.data ?? []) as { product_id: string }[]).map((r) => r.product_id));
  const categories = new Set<string>(((catRes.data ?? []) as { category: string }[]).map((r) => r.category));
  return { productIds, categories };
}

// 체크아웃 검증 — 통합 쿠폰(issued_coupons) 조회. scope 분기:
//   - public:   소유자 없음·다회(used_count<max_uses)·비로그인 허용 — 구 discount_codes 대체
//   - personal: 소유자 한정·1회(is_used) — 로그인 필요
// 공통: 미만료·미사용기간전·최소주문액·1인당 한도·비활성 차단.
// 상품/카테고리 한정 시: lineTotalsByProduct(상품→라인합계)로 '해당 상품 소계'에만 할인. 대상 없으면 사용 불가.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findUsableCoupon(admin: any, opts: { code: string; userId?: string | null; email?: string | null; subtotalUsd: number; lineTotalsByProduct?: Map<string, number> }): Promise<UsableCoupon | null> {
  const codeU = opts.code.toUpperCase().trim();
  const { data } = await admin
    .from("issued_coupons")
    .select("id, code, name, type, value, min_order_usd, starts_at, expires_at, is_used, is_active, scope, max_uses, used_count, per_user_limit, user_id, email")
    .eq("code", codeU)
    .maybeSingle();
  if (!data) return null;

  if (data.is_active === false) return null; // 정지(suspend) — 개인·공개 공통

  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) return null; // 아직 사용기간 전
  if (data.expires_at && new Date(data.expires_at) < now) return null;
  if (opts.subtotalUsd < (data.min_order_usd ?? 0)) return null;

  // 1인당 사용 한도 — 로그인 회원의 이 코드 사용 이력 ≥ 한도면 사용 불가. (비로그인은 검증 불가 → 통과)
  if (data.per_user_limit != null && opts.userId) {
    const { count } = await admin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("code", codeU)
      .eq("user_id", opts.userId);
    if ((count ?? 0) >= data.per_user_limit) return null;
  }

  if ((data.scope ?? "personal") === "public") {
    // 공개 쿠폰은 회원이 직접 발급(claim)받아야 사용 가능 — 발급 기록 필수(로그인 필요).
    if (!opts.userId) return null;
    const { data: claim } = await admin
      .from("coupon_claims")
      .select("coupon_id")
      .eq("coupon_id", data.id)
      .eq("user_id", opts.userId)
      .maybeSingle();
    if (!claim) return null; // 미발급
    if (data.max_uses != null && (data.used_count ?? 0) >= data.max_uses) return null;
  } else {
    if (data.is_used) return null;
    const ownsByUser = !!data.user_id && !!opts.userId && data.user_id === opts.userId;
    const ownsByEmail = !!data.email && !!opts.email && data.email.toLowerCase() === opts.email.toLowerCase();
    if (!ownsByUser && !ownsByEmail) return null;
  }

  // 상품/카테고리 한정 — 대상 상품 라인 합계에만 할인. 대상이 장바구니에 없으면 사용 불가.
  let discountBase = opts.subtotalUsd;
  const targets = await getCouponTargets(admin, data.id);
  if (targets.productIds.size > 0 || targets.categories.size > 0) {
    const map = opts.lineTotalsByProduct ?? new Map<string, number>();
    const cartProductIds = [...map.keys()];
    const eligible = new Set<string>(cartProductIds.filter((id) => targets.productIds.has(id)));
    if (targets.categories.size > 0 && cartProductIds.length > 0) {
      const { data: prods } = await admin.from("products").select("id, category").in("id", cartProductIds);
      for (const p of (prods ?? []) as { id: string; category: string | null }[]) {
        if (p.category && targets.categories.has(p.category)) eligible.add(p.id);
      }
    }
    let eligibleSubtotal = 0;
    for (const id of eligible) eligibleSubtotal += map.get(id) ?? 0;
    if (eligibleSubtotal <= 0) return null; // 적용 가능한 대상 상품이 장바구니에 없음
    discountBase = round2(eligibleSubtotal);
  }

  const discountAmount =
    data.type === "percent"
      ? round2(discountBase * (data.value / 100))
      : Math.min(data.value, discountBase);
  return { id: data.id, code: data.code, name: data.name ?? null, type: data.type, value: data.value, discountAmount };
}

// 주문 할인액(USD) 서버 권위 산출 — 쿠폰/레퍼럴 코드로 재계산(클라이언트 discountAmount 불신).
// 결제(lemon-checkout·toss-confirm)에서 호출해 실제 청구 할인을 확정한다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveOrderDiscountUsd(admin: any, opts: {
  couponCode?: string | null;
  referralCode?: string | null;
  userId?: string | null;
  email?: string | null;
  subtotalUsd: number;
  lineTotalsByProduct?: Map<string, number>;
}): Promise<number> {
  if (opts.couponCode) {
    const c = await findUsableCoupon(admin, {
      code: opts.couponCode, userId: opts.userId, email: opts.email,
      subtotalUsd: opts.subtotalUsd, lineTotalsByProduct: opts.lineTotalsByProduct,
    });
    return c ? c.discountAmount : 0;
  }
  if (opts.referralCode) {
    const { data } = await admin
      .from("referral_codes")
      .select("discount_percent, discount_type")
      .eq("code", opts.referralCode.toUpperCase().trim())
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return 0;
    return data.discount_type === "fixed"
      ? Math.min(data.discount_percent, opts.subtotalUsd)
      : round2(opts.subtotalUsd * (data.discount_percent / 100));
  }
  return 0;
}

// 사용 처리(멱등) — 결제 성공 후 코드로 사용 표시. scope 분기:
//   - public:   used_count 원자적 증가(RPC, 한도 초과 차단)
//   - personal: is_used 표시
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function redeemCouponByCode(admin: any, code: string, orderId: string | null): Promise<void> {
  if (!code) return;
  const codeU = code.toUpperCase().trim();
  try {
    const { data } = await admin.from("issued_coupons").select("scope").eq("code", codeU).maybeSingle();
    if ((data?.scope ?? "personal") === "public") {
      await admin.rpc("redeem_public_coupon", { p_code: codeU });
    } else {
      await admin
        .from("issued_coupons")
        .update({ is_used: true, used_order_id: orderId ?? null, used_at: new Date().toISOString() })
        .eq("code", codeU)
        .eq("is_used", false);
    }
  } catch {
    /* 집계 실패는 주문에 영향 없음 */
  }
}

// 사용 이력 기록(멱등은 호출측 dup 가드에 의존) — 1인당 한도 집계용. 로그인 회원만.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordCouponRedemption(admin: any, code: string, userId: string | null, orderId: string | null): Promise<void> {
  if (!code || !userId) return;
  try {
    await admin.from("coupon_redemptions").insert({
      code: code.toUpperCase().trim(),
      user_id: userId,
      order_id: orderId ?? null,
    });
  } catch {
    /* 집계 실패는 주문에 영향 없음 */
  }
}

export interface IssuePublicCouponParams {
  code?: string | null;            // 지정 코드(대문자화) — 미지정 시 자동 생성
  type: "percent" | "fixed";
  value: number;
  maxUses?: number | null;         // null = 무제한(전체)
  perUserLimit?: number | null;    // null = 무제한(1인당)
  minOrderUsd?: number;
  startsAt?: string | null;        // 사용 시작 ISO (null = 즉시)
  expiresAt?: string | null;       // 사용 종료 ISO (null = 무기한) — expiresMonths보다 우선
  expiresMonths?: number | null;   // null = 무기한 (기본 무기한)
  productIds?: string[];           // 한정 상품(비어있으면 전체)
  categories?: string[];           // 한정 카테고리(비어있으면 전체)
  name?: string | null;            // 쿠폰 이름(명목) — 고객 노출용
}

// 발급된 쿠폰에 상품/카테고리 한정 대상 기록.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertCouponTargets(admin: any, couponId: string, productIds?: string[], categories?: string[]): Promise<void> {
  const pIds = [...new Set((productIds ?? []).filter(Boolean))];
  const cats = [...new Set((categories ?? []).filter(Boolean))];
  if (pIds.length > 0) {
    await admin.from("coupon_products").insert(pIds.map((product_id) => ({ coupon_id: couponId, product_id })));
  }
  if (cats.length > 0) {
    await admin.from("coupon_categories").insert(cats.map((category) => ({ coupon_id: couponId, category })));
  }
}

// 공개 쿠폰 발급(scope='public') — 어드민용. 성공 시 코드 반환.
// 지정 코드가 이미 있으면 null(충돌). 미지정 시 유니크 코드 생성·재시도.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function issuePublicCoupon(admin: any, params: IssuePublicCouponParams): Promise<string | null> {
  if (!params.value || params.value <= 0) return null;
  // 종료일: expiresAt(명시) 우선, 없으면 expiresMonths로 산출(기본 무기한).
  let expiresAt: string | null;
  if (params.expiresAt !== undefined) {
    expiresAt = params.expiresAt || null;
  } else {
    const months = params.expiresMonths === undefined ? null : params.expiresMonths;
    expiresAt = months == null ? null : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  const row = {
    type: params.type,
    value: params.value,
    source: "promo",
    scope: "public",
    max_uses: params.maxUses ?? null,
    per_user_limit: params.perUserLimit ?? null,
    min_order_usd: params.minOrderUsd ?? 0,
    is_active: true,
    starts_at: params.startsAt || null,
    expires_at: expiresAt,
    name: params.name?.trim() || null,
  };

  // 지정 코드 — 충돌 시 실패(어드민이 다른 코드로 재시도).
  if (params.code && params.code.trim()) {
    const code = params.code.toUpperCase().trim();
    const { data, error } = await admin.from("issued_coupons").insert({ code, ...row }).select("id").single();
    if (error || !data) return null;
    await insertCouponTargets(admin, data.id, params.productIds, params.categories);
    return code;
  }

  // 자동 생성 — 코드 충돌 시 재시도.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const { data, error } = await admin.from("issued_coupons").insert({ code, ...row }).select("id").single();
    if (!error && data) {
      await insertCouponTargets(admin, data.id, params.productIds, params.categories);
      return code;
    }
    if (!String(error?.message ?? "").toLowerCase().includes("duplicate")) return null;
  }
  return null;
}

export async function getAccountCouponsData(admin: any, userId: string, userEmail: string | null) {
  // 가입 환영 쿠폰 — 최초 1회(멱등) 보장
  // promotions.ts 모듈을 다이나믹 임포트하거나 호출 (promotions.ts의 grantSignupCoupon)
  const { grantSignupCoupon } = require("@/lib/promotions");
  await grantSignupCoupon(admin, userId, userEmail);

  const email = userEmail?.toLowerCase() ?? "";
  const nowIso = new Date().toISOString();

  const SELECT_COLS = "id, code, name, type, value, source, min_order_usd, expires_at, created_at";

  // 1) 소유 개인 쿠폰
  const { data: personalData } = await admin
    .from("issued_coupons")
    .select(SELECT_COLS)
    .or(`user_id.eq.${userId},email.eq.${email}`)
    .neq("scope", "public")
    .eq("is_used", false)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(100);

  // 2) 적용 가능한 활성 공개 쿠폰
  const { data: publicRaw } = await admin
    .from("issued_coupons")
    .select(`${SELECT_COLS}, max_uses, used_count, per_user_limit`)
    .eq("scope", "public")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(100);

  type PubRow = { id: string; code: string; max_uses: number | null; used_count: number; per_user_limit: number | null };
  let publicRows = ((publicRaw ?? []) as PubRow[]).filter(
    (c) => c.max_uses == null || (c.used_count ?? 0) < c.max_uses
  );

  // 1인당 한도
  const limited = publicRows.filter((c) => c.per_user_limit != null);
  if (limited.length > 0) {
    const { data: reds } = await admin
      .from("coupon_redemptions")
      .select("code")
      .eq("user_id", userId)
      .in("code", limited.map((c) => c.code));
    const usedByCode = new Map<string, number>();
    for (const r of (reds ?? []) as { code: string }[]) usedByCode.set(r.code, (usedByCode.get(r.code) ?? 0) + 1);
    publicRows = publicRows.filter((c) => c.per_user_limit == null || (usedByCode.get(c.code) ?? 0) < c.per_user_limit);
  }

  // 발급(claim) 기록
  const eligibleIds = publicRows.map((c) => c.id);
  const claimedIds = new Set<string>();
  if (eligibleIds.length > 0) {
    const { data: claims } = await admin
      .from("coupon_claims")
      .select("coupon_id")
      .eq("user_id", userId)
      .in("coupon_id", eligibleIds);
    for (const r of (claims ?? []) as { coupon_id: string }[]) claimedIds.add(r.coupon_id);
  }

  const toOut = (c: Record<string, unknown>) => ({
    id: c.id, code: c.code, name: c.name, type: c.type, value: c.value, source: c.source, min_order_usd: c.min_order_usd, expires_at: c.expires_at, created_at: c.created_at
  });
  const eligibleSet = new Set(eligibleIds);
  const publicAll = (publicRaw ?? []) as Record<string, unknown>[];
  const claimedPublic = publicAll.filter((c) => claimedIds.has(c.id as string)).map(toOut);
  const claimablePublic = publicAll.filter((c) => eligibleSet.has(c.id as string) && !claimedIds.has(c.id as string)).map(toOut);

  const coupons = [...(personalData ?? []), ...claimedPublic] as any[];

  // 상품/카테고리 한정 대상 매핑
  const allRows = [...coupons, ...claimablePublic] as { id: string }[];
  const productIdsByCoupon = new Map<string, Set<string>>();
  if (allRows.length > 0) {
    const ids = [...new Set(allRows.map((c) => c.id))];
    const [cp, cc] = await Promise.all([
      admin.from("coupon_products").select("coupon_id, product_id").in("coupon_id", ids),
      admin.from("coupon_categories").select("coupon_id, category").in("coupon_id", ids),
    ]);
    for (const r of (cp.data ?? []) as { coupon_id: string; product_id: string }[]) {
      if (!productIdsByCoupon.has(r.coupon_id)) productIdsByCoupon.set(r.coupon_id, new Set());
      productIdsByCoupon.get(r.coupon_id)!.add(r.product_id);
    }
    const catRows = (cc.data ?? []) as { coupon_id: string; category: string }[];
    if (catRows.length > 0) {
      const cats = [...new Set(catRows.map((r) => r.category))];
      const { data: prods } = await admin.from("products").select("id, category").in("category", cats);
      const byCategory = new Map<string, string[]>();
      for (const p of (prods ?? []) as { id: string; category: string }[]) {
        if (!byCategory.has(p.category)) byCategory.set(p.category, []);
        byCategory.get(p.category)!.push(p.id);
      }
      for (const r of catRows) {
        if (!productIdsByCoupon.has(r.coupon_id)) productIdsByCoupon.set(r.coupon_id, new Set());
        for (const pid of byCategory.get(r.category) ?? []) productIdsByCoupon.get(r.coupon_id)!.add(pid);
      }
    }
  }

  const withTargets = (c: any) => ({
    ...c,
    product_ids: productIdsByCoupon.has(c.id) ? [...productIdsByCoupon.get(c.id)!] : null
  });

  return {
    coupons: coupons.map(withTargets),
    claimable: claimablePublic.map(withTargets),
  };
}
