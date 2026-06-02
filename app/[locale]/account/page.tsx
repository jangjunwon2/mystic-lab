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
  let profile: { display_name: string | null; avatar_url: string | null; role: string } | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/${locale}/sign-in?redirect=/${locale}/account`);
    }

    const [profileRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url, role").eq("id", user.id).single(),
      supabase
        .from("orders")
        .select(`
          id, status, total_usd, created_at, customer_email,
          tracking_number, tracking_carrier, shipping_method,
          order_items (
            id, quantity, price_usd,
            products (id, slug, thumbnail_url, product_translations(name, language))
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    profile = profileRes.data as typeof profile;
    orders = ordersRes.data ?? [];
  } catch {
    redirect(`/${locale}/sign-in?redirect=/${locale}/account`);
  }

  return (
    <AccountClient
      locale={locale}
      profile={profile}
      orders={orders}
    />
  );
}
