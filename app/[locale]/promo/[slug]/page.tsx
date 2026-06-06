import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import PromoLandingClient from "@/components/promo/PromoLandingClient";

interface Props { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createAdminClient()) as any;
  const { data } = await db.from("promo_pages").select("title, subtitle").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Promo — Mystic Lab" };
  return { title: `${data.title} — Mystic Lab`, description: data.subtitle ?? undefined };
}

export default async function PromoPage({ params }: Props) {
  const { locale, slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createAdminClient()) as any;

  const { data: page } = await db
    .from("promo_pages")
    .select("id, slug, title, subtitle, description, image_url, badge_text, coupon_id, is_active, ends_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!page || !page.is_active) notFound();

  let coupon = null;
  if (page.coupon_id) {
    const { data: c } = await db
      .from("issued_coupons")
      .select("id, code, name, type, value, min_order_usd, expires_at, max_uses, used_count, is_active, scope")
      .eq("id", page.coupon_id)
      .maybeSingle();
    coupon = c ?? null;
  }

  return <PromoLandingClient page={page} coupon={coupon} locale={locale} />;
}
