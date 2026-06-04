import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import { loadAllProductsLite } from "@/lib/admin/load-products-lite";

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
  is_digital: boolean;
  thumbnail_url: string | null;
  demo_video_cloudflare_id: string | null;
  image_urls: string[];
  product_translations: { language: string; name: string; description: string; short_description: string | null }[];
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: product } = await supabase
    .from("products")
    .select(`
      id, slug, category, price_usd, stock, is_active, is_featured, is_digital,
      thumbnail_url, demo_video_cloudflare_id, image_urls,
      product_translations(language, name, description, short_description)
    `)
    .eq("id", id)
    .single();

  if (!product) notFound();

  const { data: optionRows } = await supabase
    .from("product_options")
    .select("linked_product_id, discount_type, discount_value")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  const allProducts = await loadAllProductsLite();

  const p = product as RawProduct;

  const initial = {
    slug: p.slug,
    category: p.category,
    price_usd: p.price_usd,
    stock: p.stock,
    is_active: p.is_active,
    is_featured: p.is_featured,
    is_digital: p.is_digital,
    thumbnail_url: p.thumbnail_url ?? "",
    demo_video_cloudflare_id: p.demo_video_cloudflare_id ?? "",
    image_urls: p.image_urls ?? [],
    translations: p.product_translations.map((t) => ({
      language: t.language,
      name: t.name,
      description: t.description,
      short_description: t.short_description ?? "",
    })),
    options: ((optionRows ?? []) as {
      linked_product_id: string | null; discount_type: string | null; discount_value: number | null;
    }[])
      .filter((o) => o.linked_product_id)
      .map((o) => ({
        linked_product_id: o.linked_product_id!,
        discount_type: (o.discount_type === "fixed" ? "fixed" : "percent") as "percent" | "fixed",
        discount_value: Number(o.discount_value) || 0,
      })),
  };

  const enName = initial.translations.find((t) => t.language === "en")?.name ?? p.slug;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        수정: {enName}
      </h1>
      <ProductForm productId={id} initial={initial} allProducts={allProducts} />
    </div>
  );
}
