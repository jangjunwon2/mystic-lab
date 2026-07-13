import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { decryptCode } from "@/lib/crypto/unlock-code";
import AccountClient from "@/components/account/AccountClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "My Account",
    ko: "내 계정",
    ja: "マイアカウント",
    "zh-CN": "我的账户",
    es: "Mi cuenta",
    fr: "Mon compte",
    de: "Mein Konto",
  };
  return { title: titles[locale] ?? titles.en, robots: "noindex" };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });

  let orders: unknown[] = [];
  let customOrders: unknown[] = [];
  let wishlist: unknown[] = [];
  let grants: unknown[] = [];
  let initialCodes: Record<string, string> = {};
  let profile: { display_name: string | null; avatar_url: string | null; role: string } | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/${locale}/sign-in?redirect=/${locale}/account`);
    }

    const admin = (await createAdminClient()) as any;

    const [profileRes, ordersRes, wishlistRes, customOrdersRes, grantsRes, codesRes] = await Promise.all([
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
      supabase
        .from("wishlists")
        .select("id, product_id, products(id, slug, thumbnail_url, price_usd, product_translations(name, language))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("custom_order_requests")
        .select("id, name, description, budget_range, desired_deadline, quoted_price_usd, quoted_price_krw, payment_status, payment_token, status, created_at, admin_message")
        .eq("email", user.email ?? "")
        .order("created_at", { ascending: false }),
      supabase
        .from("manual_video_grants")
        .select(`
          id, expires_at, created_at,
          products (id, slug, thumbnail_url, product_translations(name, language))
        `)
        .eq("user_id", user.id),
      admin
        .from("product_unlock_codes")
        .select("product_id, code_plain")
        .eq("user_id", user.id),
    ]);

    type ProfileRow = { display_name: string | null; avatar_url: string | null; role: string };
    const rawProfile = profileRes.data as unknown as ProfileRow | null;
    orders = ordersRes.data ?? [];
    customOrders = customOrdersRes.data ?? [];
    wishlist = wishlistRes.data ?? [];
    grants = grantsRes.data ?? [];

    const rawCodes = (codesRes.data ?? []) as { product_id: string; code_plain: string | null }[];
    for (const item of rawCodes) {
      if (item.code_plain) {
        try {
          const decrypted = decryptCode(item.code_plain);
          if (decrypted) {
            initialCodes[item.product_id] = decrypted;
          }
        } catch { /* ignore */ }
      }
    }

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
      grants={grants}
      initialCodes={initialCodes}
    />
  );
}
