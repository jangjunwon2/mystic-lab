// 개인 발급 쿠폰(issued_coupons) — 발급·검증·사용 처리. service-role(admin client)로 접근.
// 공용 할인코드(discount_codes)와 별개: 특정 회원/이메일에게 1회용으로 지급.

const round2 = (n: number) => Math.round(n * 100) / 100;

// 혼동되는 글자(0/O, 1/I) 제외
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(prefix = "ML"): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
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
    const { error } = await admin.from("issued_coupons").insert({
      code,
      user_id: params.userId ?? null,
      email: params.email ? params.email.toLowerCase() : null,
      type: params.type,
      value: params.value,
      source: params.source,
      min_order_usd: params.minOrderUsd ?? 0,
      expires_at: expiresAt,
    });
    if (!error) return code;
    // 코드 충돌 외 오류면 중단
    if (!String(error.message ?? "").toLowerCase().includes("duplicate")) return null;
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
  type: "percent" | "fixed";
  value: number;
  discountAmount: number;
}

// 체크아웃 검증 — 통합 쿠폰(issued_coupons) 조회. scope 분기:
//   - public:   소유자 없음·다회(used_count<max_uses)·비로그인 허용 — 구 discount_codes 대체
//   - personal: 소유자 한정·1회(is_used) — 로그인 필요
// 공통: 미만료·최소주문액·비활성 차단.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findUsableCoupon(admin: any, opts: { code: string; userId?: string | null; email?: string | null; subtotalUsd: number }): Promise<UsableCoupon | null> {
  const codeU = opts.code.toUpperCase().trim();
  const { data } = await admin
    .from("issued_coupons")
    .select("id, code, type, value, min_order_usd, starts_at, expires_at, is_used, is_active, scope, max_uses, used_count, per_user_limit, user_id, email")
    .eq("code", codeU)
    .maybeSingle();
  if (!data) return null;

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
    if (data.is_active === false) return null;
    if (data.max_uses != null && (data.used_count ?? 0) >= data.max_uses) return null;
  } else {
    if (data.is_used) return null;
    const ownsByUser = !!data.user_id && !!opts.userId && data.user_id === opts.userId;
    const ownsByEmail = !!data.email && !!opts.email && data.email.toLowerCase() === opts.email.toLowerCase();
    if (!ownsByUser && !ownsByEmail) return null;
  }

  const discountAmount =
    data.type === "percent"
      ? round2(opts.subtotalUsd * (data.value / 100))
      : Math.min(data.value, opts.subtotalUsd);
  return { id: data.id, code: data.code, type: data.type, value: data.value, discountAmount };
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
  };

  // 지정 코드 — 충돌 시 실패(어드민이 다른 코드로 재시도).
  if (params.code && params.code.trim()) {
    const code = params.code.toUpperCase().trim();
    const { error } = await admin.from("issued_coupons").insert({ code, ...row });
    return error ? null : code;
  }

  // 자동 생성 — 코드 충돌 시 재시도.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    const { error } = await admin.from("issued_coupons").insert({ code, ...row });
    if (!error) return code;
    if (!String(error.message ?? "").toLowerCase().includes("duplicate")) return null;
  }
  return null;
}
