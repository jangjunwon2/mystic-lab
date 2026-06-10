import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import ProductsClient from "@/components/products/ProductsClient";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string; search?: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

const PRODUCTS_DESC: Record<string, string> = {
  en: "Browse premium magic props and custom electronic devices for professional magicians.",
  ko: "프로 마술사를 위한 프리미엄 마술 도구와 맞춤 전자 기기를 둘러보세요.",
  ja: "プロマジシャン向けのプレミアムマジック用品とカスタム電子機器を探す。",
  "zh-CN": "浏览为专业魔术师准备的优质魔术道具和定制电子设备。",
  es: "Explora accesorios de magia premium y dispositivos electrónicos para magos profesionales.",
  fr: "Découvrez des accessoires de magie premium et des appareils électroniques pour les magiciens professionnels.",
  de: "Premium-Zauberzubehör und maßgeschneiderte elektronische Geräte für professionelle Zauberer.",
};

export async function generateMetadata({ params }: ProductsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  const description = PRODUCTS_DESC[locale] ?? PRODUCTS_DESC.en;
  return {
    title: t("title"),
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/products`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/products`])),
        "x-default": `${SITE_URL}/en/products`,
      },
    },
    openGraph: {
      title: `${t("title")} | Mystic Lab`,
      description,
      url: `${SITE_URL}/${locale}/products`,
    },
  };
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
    .filter((p) =>
      !searchLower ||
      p.name.toLowerCase().includes(searchLower) ||
      (p.short_description ?? "").toLowerCase().includes(searchLower)
    );

  const { data: { user } } = await supabase.auth.getUser();

  return <ProductsClient locale={locale} filters={filters} products={products} allCategories={allCategories} isLoggedIn={!!user} />;
}
