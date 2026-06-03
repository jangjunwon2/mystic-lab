import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import AboutBanner from "@/components/home/AboutBanner";
import CustomOrderBanner from "@/components/home/CustomOrderBanner";
import UnlockBanner from "@/components/home/UnlockBanner";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data }, { data: categoryData }] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, price_usd, thumbnail_url, category, product_translations(name, short_description, language)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("display_order", { ascending: true })
      .limit(6),
    supabase
      .from("products")
      .select("category")
      .eq("is_active", true),
  ]);

  const featured = ((data ?? []) as {
    id: string;
    slug: string;
    price_usd: number;
    thumbnail_url: string | null;
    category: string;
    product_translations: { name: string; short_description: string | null; language: string }[];
  }[]).map((p) => {
    const t =
      p.product_translations?.find((t) => t.language === locale) ??
      p.product_translations?.find((t) => t.language === "en") ??
      p.product_translations?.[0];
    return {
      id: p.id,
      slug: p.slug,
      name: t?.name ?? p.slug,
      shortDescription: t?.short_description ?? null,
      price: p.price_usd,
      category: p.category,
      thumbnail: p.thumbnail_url,
    };
  });

  const activeCategories = Array.from(
    new Set(((categoryData ?? []) as { category: string }[]).map((p) => p.category))
  );

  return (
    <div className="flex flex-col">
      <HeroSection />
      <CategoryShowcase categories={activeCategories} locale={locale} />
      <FeaturedProducts products={featured} locale={locale} />
      <AboutBanner locale={locale} />
      <CustomOrderBanner />
      <UnlockBanner />
    </div>
  );
}
