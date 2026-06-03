import { createAdminClient } from "@/lib/supabase/server";
import NewsletterClient from "@/components/admin/NewsletterClient";

export const metadata = { title: "Newsletter — Admin" };

export default async function AdminNewsletterPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data } = await supabase
    .from("products")
    .select("id, slug, product_translations(name, language)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products: { id: string; name: string }[] = ((data ?? []) as {
    id: string; slug: string;
    product_translations: { name: string; language: string }[];
  }[]).map((p) => ({
    id: p.id,
    name: p.product_translations.find((t) => t.language === "en")?.name ?? p.slug,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          뉴스레터
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          회원, 구매자 전체, 또는 특정 상품 구매자에게 이메일을 발송합니다.
        </p>
      </div>

      <NewsletterClient products={products} />
    </div>
  );
}
