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

  const SELECT_COLS = "id, code, name, type, value, source, min_order_usd, expires_at, created_at";

  // 1) 소유 개인 쿠폰 — 소유자(user_id 또는 이메일)·미사용·미만료·미정지.
  const { data: personalData } = await admin
    .from("issued_coupons")
    .select(SELECT_COLS)
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .neq("scope", "public")
    .eq("is_used", false)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(100);

  // 2) 적용 가능한 활성 공개 쿠폰 — 기간 내·전체 한도 미초과·1인당 한도 미초과.
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

  // 1인당 한도 — 회원의 코드별 사용 횟수 ≥ 한도면 제외.
  const limited = publicRows.filter((c) => c.per_user_limit != null);
  if (limited.length > 0) {
    const { data: reds } = await admin
      .from("coupon_redemptions")
      .select("code")
      .eq("user_id", user.id)
      .in("code", limited.map((c) => c.code));
    const usedByCode = new Map<string, number>();
    for (const r of (reds ?? []) as { code: string }[]) usedByCode.set(r.code, (usedByCode.get(r.code) ?? 0) + 1);
    publicRows = publicRows.filter((c) => c.per_user_limit == null || (usedByCode.get(c.code) ?? 0) < c.per_user_limit);
  }

  // 발급(claim) 기록 — 공개 쿠폰은 '발급받은 것'만 드롭다운에 노출, 미발급은 '발급 가능' 목록으로 분리.
  const eligibleIds = publicRows.map((c) => c.id);
  const claimedIds = new Set<string>();
  if (eligibleIds.length > 0) {
    const { data: claims } = await admin
      .from("coupon_claims")
      .select("coupon_id")
      .eq("user_id", user.id)
      .in("coupon_id", eligibleIds);
    for (const r of (claims ?? []) as { coupon_id: string }[]) claimedIds.add(r.coupon_id);
  }

  const toOut = (c: Record<string, unknown>) => ({ id: c.id, code: c.code, name: c.name, type: c.type, value: c.value, source: c.source, min_order_usd: c.min_order_usd, expires_at: c.expires_at, created_at: c.created_at });
  const eligibleSet = new Set(eligibleIds);
  const publicAll = (publicRaw ?? []) as Record<string, unknown>[];
  const claimedPublic = publicAll.filter((c) => claimedIds.has(c.id as string)).map(toOut);
  const claimablePublic = publicAll.filter((c) => eligibleSet.has(c.id as string) && !claimedIds.has(c.id as string)).map(toOut);

  // 드롭다운용 = 개인 쿠폰 + 발급받은 공개 쿠폰
  const coupons = ([...(personalData ?? []), ...claimedPublic]) as { id: string }[];

  // 상품/카테고리 한정 대상 → 적용 가능 product_ids 산출(드롭다운/발급목록 표시용). coupons + claimable 모두.
  const allRows = ([...coupons, ...claimablePublic]) as { id: string }[];
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withTargets = (c: any) => ({ ...c, product_ids: productIdsByCoupon.has(c.id) ? [...productIdsByCoupon.get(c.id)!] : null });

  return NextResponse.json({
    coupons: coupons.map(withTargets),
    claimable: claimablePublic.map(withTargets),
  });
}
