import { createAdminClient } from "@/lib/supabase/server";
import ManualOrderForm from "@/components/admin/ManualOrderForm";

export const metadata = { title: "New Order — Admin" };

export default async function AdminNewOrderPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [profilesRes, authRes, productsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase
      .from("products")
      .select("id, slug, price_usd, product_translations(name, language)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const emailMap = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authRes.data?.users ?? []).map((u: any) => [u.id as string, u.email as string])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (profilesRes.data ?? []).map((p: any) => ({
    id: p.id as string,
    display_name: p.display_name as string | null,
    email: emailMap.get(p.id) ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (productsRes.data ?? []).map((p: any) => ({
    id: p.id as string,
    slug: p.slug as string,
    price_usd: p.price_usd as number,
    name: (p.product_translations as { name: string; language: string }[])
      .find((t) => t.language === "en")?.name ?? p.slug,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>
        수동 주문 생성
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        주문은 <strong style={{ color: "#10B981" }}>결제완료</strong> 상태로 생성됩니다 — 고객은 즉시 해법 영상에 접근할 수 있습니다.
      </p>
      <ManualOrderForm users={users} products={products} />
    </div>
  );
}
