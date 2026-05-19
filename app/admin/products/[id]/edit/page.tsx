import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Product — Admin" };

interface RawProduct {
  id: string;
  slug: string;
  category: string;
  price_usd: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  thumbnail_url: string | null;
  demo_video_cloudflare_id: string | null;
  product_translations: { language: string; name: string; description: string; short_description: string | null }[];
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: product } = await supabase
    .from("products")
    .select(`
      id, slug, category, price_usd, stock, is_active, is_featured,
      thumbnail_url, demo_video_cloudflare_id,
      product_translations(language, name, description, short_description)
    `)
    .eq("id", id)
    .single();

  if (!product) notFound();

  const p = product as RawProduct;

  const initial = {
    slug: p.slug,
    category: p.category,
    price_usd: p.price_usd,
    stock: p.stock,
    is_active: p.is_active,
    is_featured: p.is_featured,
    thumbnail_url: p.thumbnail_url ?? "",
    demo_video_cloudflare_id: p.demo_video_cloudflare_id ?? "",
    translations: p.product_translations.map((t) => ({
      language: t.language,
      name: t.name,
      description: t.description,
      short_description: t.short_description ?? "",
    })),
  };

  const enName = initial.translations.find((t) => t.language === "en")?.name ?? p.slug;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        Edit: {enName}
      </h1>
      <ProductForm productId={id} initial={initial} />
    </div>
  );
}
