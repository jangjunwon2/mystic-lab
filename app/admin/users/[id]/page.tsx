import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import UserDetailClient from "@/components/admin/UserDetailClient";

export const metadata = { title: "User Detail — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [profileRes, ordersRes, grantsRes, authRes, productsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, status, suspension_reason, admin_notes, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("orders")
      .select(`
        id, status, total_usd, created_at,
        order_items(id, quantity, price_usd,
          products(id, slug, product_translations(name, language))
        )
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("manual_video_grants")
      .select(`
        id, note, expires_at, created_at,
        products(id, slug, product_translations(name, language))
      `)
      .eq("user_id", id),
    supabase.auth.admin.getUserById(id),
    supabase
      .from("products")
      .select("id, slug, product_translations(name, language)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  if (!profileRes.data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProducts = (productsRes.data ?? []).map((p: any) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: (p.product_translations as { name: string; language: string }[])
      .find((t) => t.language === "en")?.name ?? p.slug,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        회원 상세
      </h1>
      <UserDetailClient
        profile={{ ...profileRes.data, status: profileRes.data.status ?? "active", admin_notes: profileRes.data.admin_notes ?? null }}
        email={authRes.data?.user?.email ?? null}
        orders={ordersRes.data ?? []}
        grants={grantsRes.data ?? []}
        allProducts={allProducts}
      />
    </div>
  );
}
