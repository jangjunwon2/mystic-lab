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

  // 소유자(user_id 또는 이메일)·미사용·미만료 개인 쿠폰. (공개 쿠폰은 '소유' 개념이 없어 제외)
  const { data } = await admin
    .from("issued_coupons")
    .select("id, code, type, value, source, min_order_usd, expires_at, created_at")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .neq("scope", "public")
    .eq("is_used", false)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(100);

  const coupons = (data ?? []) as { id: string }[];

  // 상품/카테고리 한정 대상 → 적용 가능 product_ids 산출(드롭다운 활성/비활성용). 한정 없으면 null(전체).
  const productIdsByCoupon = new Map<string, Set<string>>();
  if (coupons.length > 0) {
    const ids = coupons.map((c) => c.id);
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

  const result = coupons.map((c) => ({
    ...c,
    product_ids: productIdsByCoupon.has(c.id) ? [...productIdsByCoupon.get(c.id)!] : null,
  }));

  return NextResponse.json({ coupons: result });
}
