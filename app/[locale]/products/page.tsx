import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import ProductsClient from "@/components/products/ProductsClient";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string; search?: string }>;
}

export async function generateMetadata({ params }: ProductsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return { title: t("title") };
}

export interface ProductItem {
  id: string;
  slug: string;
  category: string;
  price_usd: number;
  is_featured: boolean;
  thumbnail_url: string | null;
  name: string;
  short_description: string | null;
}

export interface BundleItemView {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  thumbnail_url: string | null;
  quantity: number;
}

export interface BundleView {
  id: string;
  name: string;
  discount_percent: number;
  items: BundleItemView[];
  original: number;
  discounted: number;
}

interface RawBundleRow {
  id: string;
  name: string;
  discount_percent: number;
  bundle_items: {
    quantity: number;
    products: {
      id: string;
      slug: string;
      price_usd: number;
      thumbnail_url: string | null;
      product_translations: { name: string; language: string }[];
    } | null;
  }[];
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale } = await params;
  const filters = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: allData }, { data: filteredData }] = await Promise.all([
    supabase
      .from("products")
      .select("category")
      .eq("is_active", true),
    (() => {
      let q = supabase
        .from("products")
        .select("id, slug, category, price_usd, is_featured, thumbnail_url, product_translations(name, short_description, language)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (filters.category) q = q.eq("category", filters.category);
      return q;
    })(),
  ]);

  const allCategories = Array.from(
    new Set(((allData ?? []) as { category: string }[]).map((p) => p.category))
  );

  const data = filteredData;

  const searchLower = filters.search?.toLowerCase() ?? "";

  const products: ProductItem[] = ((data ?? []) as {
    id: string; slug: string; category: string; price_usd: number; is_featured: boolean;
    thumbnail_url: string | null;
    product_translations: { name: string; short_description: string | null; language: string }[];
  }[])
    .map((p) => {
      const translation =
        p.product_translations?.find((t) => t.language === locale) ??
        p.product_translations?.find((t) => t.language === "en") ??
        p.product_translations?.[0];
      return {
        id: p.id,
        slug: p.slug,
        category: p.category,
        price_usd: p.price_usd,
        is_featured: p.is_featured,
        thumbnail_url: p.thumbnail_url,
        name: translation?.name ?? p.slug,
        short_description: translation?.short_description ?? null,
      };
    })
    .filter((p) => !searchLower || p.name.toLowerCase().includes(searchLower));

  const { data: { user } } = await supabase.auth.getUser();

  // 활성 세트(번들) 조회 — 필터/검색 없을 때만 노출
  let bundles: BundleView[] = [];
  if (!filters.category && !filters.search) {
    const { data: bundleData } = await supabase
      .from("bundles")
      .select("id, name, discount_percent, bundle_items(quantity, products(id, slug, price_usd, thumbnail_url, product_translations(name, language)))")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    bundles = ((bundleData ?? []) as RawBundleRow[])
      .map((b) => {
        const items = (b.bundle_items ?? [])
          .filter((bi) => bi.products)
          .map((bi) => {
            const prod = bi.products!;
            const tname =
              prod.product_translations?.find((t) => t.language === locale)?.name ??
              prod.product_translations?.find((t) => t.language === "en")?.name ??
              prod.slug;
            return {
              id: prod.id,
              slug: prod.slug,
              name: tname,
              price_usd: prod.price_usd,
              thumbnail_url: prod.thumbnail_url,
              quantity: bi.quantity,
            };
          });
        const original = items.reduce((s, it) => s + it.price_usd * it.quantity, 0);
        return {
          id: b.id,
          name: b.name,
          discount_percent: b.discount_percent,
          items,
          original,
          discounted: original * (1 - b.discount_percent / 100),
        };
      })
      .filter((b) => b.items.length >= 2);
  }

  return <ProductsClient locale={locale} filters={filters} products={products} allCategories={allCategories} isLoggedIn={!!user} bundles={bundles} />;
}
