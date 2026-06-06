import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "@/components/account/AccountClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  return { title: "My Account" };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });

  let orders: unknown[] = [];
  let customOrders: unknown[] = [];
  let wishlist: unknown[] = [];
  let profile: { display_name: string | null; avatar_url: string | null; role: string } | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/${locale}/sign-in?redirect=/${locale}/account`);
    }

    const [profileRes, ordersRes, wishlistRes, customOrdersRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url, role").eq("id", user.id).single(),
      supabase
        .from("orders")
        .select(`
          id, status, total_usd, created_at, customer_email,
          tracking_number, tracking_carrier, shipping_address, shipping_method,
          stripe_payment_intent_id,
          order_items (
            id, quantity, price_usd,
            products (id, slug, thumbnail_url, product_translations(name, language))
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      (supabase as any)
        .from("wishlists")
        .select("id, product_id, products(id, slug, thumbnail_url, price_usd, product_translations(name, language))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("custom_order_requests")
        .select("id, description, budget_range, desired_deadline, quoted_price_usd, quoted_price_krw, payment_status, status, created_at, admin_message")
        .eq("email", user.email)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false }),
    ]);

    type ProfileRow = { display_name: string | null; avatar_url: string | null; role: string };
    const rawProfile = profileRes.data as unknown as ProfileRow | null;
    orders = ordersRes.data ?? [];
    customOrders = customOrdersRes.data ?? [];
    wishlist = wishlistRes.data ?? [];

    // display_name이 없으면 가입 시 입력한 이름(user metadata)으로 채워줌
    if (rawProfile && !rawProfile.display_name) {
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        null;
      if (metaName) {
        profile = { display_name: metaName, avatar_url: rawProfile.avatar_url, role: rawProfile.role };
        // DB에도 백필 (fire-and-forget)
        (supabase as any).from("profiles").update({ display_name: metaName }).eq("id", user.id);
      } else {
        profile = rawProfile;
      }
    } else {
      profile = rawProfile;
    }
  } catch {
    redirect(`/${locale}/sign-in?redirect=/${locale}/account`);
  }

  return (
    <AccountClient
      locale={locale}
      profile={profile}
      orders={orders}
      customOrders={customOrders}
      wishlist={wishlist as any}
    />
  );
}
