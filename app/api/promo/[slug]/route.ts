import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteContext { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createAdminClient()) as any;

  const { data: page } = await db
    .from("promo_pages")
    .select("id, slug, title, subtitle, description, image_url, badge_text, coupon_id, is_active, ends_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!page || !page.is_active) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let coupon = null;
  if (page.coupon_id) {
    const { data: c } = await db
      .from("issued_coupons")
      .select("id, code, name, type, value, min_order_usd, expires_at, max_uses, used_count, is_active, scope")
      .eq("id", page.coupon_id)
      .maybeSingle();
    coupon = c ?? null;
  }

  // 현재 사용자의 클레임 여부 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let alreadyClaimed = false;
  if (user && coupon) {
    const { data: claim } = await db
      .from("coupon_claims")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .maybeSingle();
    alreadyClaimed = !!claim;
  }

  return NextResponse.json({ page, coupon, loggedIn: !!user, alreadyClaimed });
}
