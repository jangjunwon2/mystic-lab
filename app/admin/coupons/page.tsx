import { createAdminClient } from "@/lib/supabase/server";
import { getSignupCouponConfig, getWishlistCouponConfig, getCartCouponConfig } from "@/lib/promotions";
import CouponsAdminClient, { type IssuedCoupon, type ProductOption } from "@/components/admin/CouponsAdminClient";
import SignupCouponCard from "@/components/admin/SignupCouponCard";
import WishlistCouponCard from "@/components/admin/WishlistCouponCard";
import PromoDashboard, { type DashboardStats } from "@/components/admin/PromoDashboard";
import CartCouponCard from "@/components/admin/CartCouponCard";

export const metadata = { title: "Coupons — Admin" };

const SOURCE_LABELS: Record<string, string> = {
  manual: "수동 발급",
  signup: "가입 환영",
  trigger: "위시리스트 정기",
  cart_trigger: "장바구니 잔존",
  bulk: "이벤트 일괄",
  newsletter: "뉴스레터",
  referral: "레퍼럴",
  promo: "프로모션",
};

function buildDashboardStats(rows: { source: string | null; scope: string | null; is_used: boolean; used_count: number; is_active: boolean; expires_at: string | null }[]): DashboardStats {
  const now = new Date().toISOString();
  const bySource = new Map<string, { issued: number; used: number }>();

  let activeCount = 0;
  for (const r of rows) {
    const src = r.source ?? "manual";
    if (!bySource.has(src)) bySource.set(src, { issued: 0, used: 0 });
    const entry = bySource.get(src)!;
    entry.issued += 1;
    if (r.scope === "public") {
      entry.used += r.used_count ?? 0;
    } else if (r.is_used) {
      entry.used += 1;
    }
    // active = is_active true, not expired, not exhausted
    if (r.is_active && (!r.expires_at || r.expires_at > now)) {
      if (r.scope !== "public" && !r.is_used) activeCount += 1;
      else if (r.scope === "public") activeCount += 1;
    }
  }

  const sourceStats = Array.from(bySource.entries()).map(([source, s]) => ({
    source,
    label: SOURCE_LABELS[source] ?? source,
    issued: s.issued,
    used: s.used,
    conversionRate: s.issued > 0 ? Math.round((s.used / s.issued) * 100) : 0,
  }));

  const totalIssued = rows.length;
  const totalUsed = sourceStats.reduce((sum, s) => sum + s.used, 0);

  return {
    bySource: sourceStats,
    totalIssued,
    totalUsed,
    conversionRate: totalIssued > 0 ? Math.round((totalUsed / totalIssued) * 100) : 0,
    activeCount,
  };
}

export default async function AdminCouponsPage() {
  const admin = await createAdminClient();
  const signupCoupon = await getSignupCouponConfig(admin);
  const wishlistCoupon = await getWishlistCouponConfig(admin);
  const cartCoupon = await getCartCouponConfig(admin);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // stats용 — 한도 없이 전체 조회(소량 컬럼만)
  const { data: allForStats } = await adminAny
    .from("issued_coupons")
    .select("source, scope, is_used, used_count, is_active, expires_at");
  const stats = buildDashboardStats((allForStats ?? []) as Parameters<typeof buildDashboardStats>[0]);

  // 목록용 — 최신 200건
  const { data } = await adminAny
    .from("issued_coupons")
    .select("id, code, name, email, user_id, type, value, source, scope, max_uses, per_user_limit, used_count, is_active, min_order_usd, is_used, starts_at, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // 상품/카테고리 한정 선택기용 — 상품 목록 + DB의 실제 카테고리(하드코딩 금지).
  const { data: prods } = await adminAny
    .from("products")
    .select("id, category, product_translations(name, language)")
    .order("created_at", { ascending: false });
  const products: ProductOption[] = ((prods ?? []) as {
    id: string; category: string | null; product_translations: { name: string; language: string }[];
  }[]).map((p) => ({
    id: p.id,
    category: p.category,
    name: p.product_translations.find((t) => t.language === "ko")?.name
      ?? p.product_translations.find((t) => t.language === "en")?.name
      ?? p.id,
  }));
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>쿠폰 발급</h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          개인 쿠폰(이메일 1회용) + 공개 쿠폰(누구나 쓰는 다회용 할인코드)을 발급합니다. (뉴스레터·레퍼럴 자동발급분도 함께 표시)
        </p>
      </div>
      <PromoDashboard stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <SignupCouponCard initial={signupCoupon} />
        <WishlistCouponCard initial={wishlistCoupon} />
        <CartCouponCard initial={cartCoupon} />
      </div>
      <CouponsAdminClient initialCoupons={(data ?? []) as IssuedCoupon[]} products={products} categories={categories} />
    </div>
  );
}
