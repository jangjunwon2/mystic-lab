import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import AboutBanner from "@/components/home/AboutBanner";
import CustomOrderBanner from "@/components/home/CustomOrderBanner";
import UnlockBanner from "@/components/home/UnlockBanner";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

const HOME_META: Record<string, { title: string; description: string }> = {
  en: { title: "Mystic Lab — Professional Magic Shop", description: "Premium magic props and custom electronic devices for professional magicians worldwide." },
  ko: { title: "미스틱 랩 — 프로 마술사 전용 마술 쇼핑몰", description: "전 세계 프로 마술사를 위한 프리미엄 마술 도구와 맞춤 전자 기기." },
  ja: { title: "ミスティック・ラボ — プロマジシャン専用マジックショップ", description: "世界中のプロマジシャン向けのプレミアムマジック用品とカスタム電子機器。" },
  "zh-CN": { title: "神秘实验室 — 专业魔术师专用魔术商店", description: "为全球专业魔术师提供优质魔术道具和定制电子设备。" },
  es: { title: "Mystic Lab — Tienda de Magia Profesional", description: "Accesorios de magia premium y dispositivos electrónicos para magos profesionales de todo el mundo." },
  fr: { title: "Mystic Lab — Boutique de Magie Professionnelle", description: "Accessoires de magie premium et appareils électroniques pour les magiciens professionnels du monde entier." },
  de: { title: "Mystic Lab — Professioneller Zauberladen", description: "Premium-Zauberzubehör und maßgeschneiderte elektronische Geräte für professionelle Zauberer weltweit." },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = HOME_META[locale] ?? HOME_META.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}`])),
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}`,
    },
  };
}

export const revalidate = 60;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data } = await supabase
    .from("products")
    .select("id, slug, price_usd, thumbnail_url, category, product_translations(name, short_description, language)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .limit(6);

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

  // featured 쿼리 결과에서 카테고리 파생 — 별도 full-scan 쿼리 제거
  const activeCategories = Array.from(new Set(featured.map((p) => p.category)));

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mystic Lab",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/${locale}/products?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mystic Lab",
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <div className="flex flex-col">
        <HeroSection />
        <CategoryShowcase categories={activeCategories} locale={locale} />
        <FeaturedProducts products={featured} locale={locale} />
        <AboutBanner locale={locale} />
        <CustomOrderBanner />
        <UnlockBanner />
      </div>
    </>
  );
}
