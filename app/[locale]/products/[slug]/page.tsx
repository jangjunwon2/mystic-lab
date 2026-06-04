import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateSignedUrl } from "@/lib/cloudflare/stream";
import ProductDetail from "@/components/products/ProductDetail";
import type { ProductCategory } from "@/lib/supabase/types";

export type ProductTranslation = {
  id: string;
  product_id: string;
  language: string;
  name: string;
  description: string;
  short_description: string | null;
  created_at: string;
};

export type ProductWithTranslations = {
  id: string;
  slug: string;
  category: ProductCategory;
  price_usd: number;
  stock: number;
  demo_video_cloudflare_id: string | null;
  thumbnail_url: string | null;
  image_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  product_translations: ProductTranslation[];
};

export type ReviewWithProfile = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export type SolutionVideo = {
  id: string;
  product_id: string;
  cloudflare_stream_id: string;
  title: string | null;
  created_at: string;
};

// 함께 구매 가능한 애드온 옵션 (연결 상품 1개 + 할인)
export type ProductOption = {
  id: string;
  linked_product_id: string;
  name: string; // 연결 상품명(로케일)
  slug: string; // 연결 상품 slug
  original: number; // 연결 상품 정가
  price: number; // 할인 적용가
};

const SAMPLE: Record<string, ProductWithTranslations> = {
  "phantom-deck": {
    id: "1", slug: "phantom-deck", category: "card_magic", price_usd: 120,
    stock: 50, demo_video_cloudflare_id: null, thumbnail_url: null,
    image_urls: [], is_active: true, is_featured: true,
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
    product_translations: [{
      id: "t1", product_id: "1", language: "en", name: "Phantom Deck",
      short_description: "Completely ungimmicked yet impossible card effects",
      description: "<p>The Phantom Deck redefines what is possible with a standard deck of cards. No gimmicks. No switches. Pure impossibility.</p><ul><li>Works with any borrowed deck</li><li>Fully examinable before and after</li><li>5 killer routines included</li><li>Fits any card worker's repertoire</li></ul><p>The method is deceptively simple — you will be amazed at what spectators are willing to believe.</p>",
      created_at: "2024-01-01T00:00:00Z"
    }]
  },
  "neural-link": {
    id: "2", slug: "neural-link", category: "electronic", price_usd: 340,
    stock: 10, demo_video_cloudflare_id: null, thumbnail_url: null,
    image_urls: [], is_active: true, is_featured: true,
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
    product_translations: [{
      id: "t2", product_id: "2", language: "en", name: "Neural Link",
      short_description: "Electronic mentalism device with zero tells",
      description: "<p>Neural Link is the most sophisticated electronic mentalism tool ever created. Hidden tech, maximum impact.</p><ul><li>Wireless signal up to 30m range</li><li>12-hour battery life</li><li>Waterproof casing (IP67)</li><li>Pairs with iOS and Android companion app</li></ul><p>The device is invisible to spectators and completely silent. Every performance detail has been obsessed over.</p>",
      created_at: "2024-01-01T00:00:00Z"
    }]
  },
  "shadow-coin": {
    id: "3", slug: "shadow-coin", category: "coin_magic", price_usd: 95,
    stock: 30, demo_video_cloudflare_id: null, thumbnail_url: null,
    image_urls: [], is_active: true, is_featured: true,
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
    product_translations: [{
      id: "t3", product_id: "3", language: "en", name: "Shadow Coin",
      short_description: "Award-winning coin gimmick for visual vanishes",
      description: "<p>Shadow Coin won Best Close-Up Device at FISM 2023. The visual vanish is so clean, spectators immediately demand to inspect your hands — and they can.</p><ul><li>Available in US Half Dollar, English 50p, and Euro 2</li><li>Fully examinable after the vanish</li><li>Reset in under 3 seconds</li></ul>",
      created_at: "2024-01-01T00:00:00Z"
    }]
  },
  "mind-vault": {
    id: "4", slug: "mind-vault", category: "mentalism", price_usd: 185,
    stock: 20, demo_video_cloudflare_id: null, thumbnail_url: null,
    image_urls: [], is_active: true, is_featured: false,
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
    product_translations: [{
      id: "t4", product_id: "4", language: "en", name: "Mind Vault",
      short_description: "Professional book test with AI-assisted reveals",
      description: "<p>Mind Vault combines classic book test methodology with cutting-edge technology for completely hands-free reveals.</p><ul><li>Works with any book, magazine, or website</li><li>Zero setup required — works straight out of the box</li><li>AI module learns your performance style over time</li></ul><p>The boldest book test ever created.</p>",
      created_at: "2024-01-01T00:00:00Z"
    }]
  },
  "prism-silk": {
    id: "5", slug: "prism-silk", category: "stage_magic", price_usd: 220,
    stock: 15, demo_video_cloudflare_id: null, thumbnail_url: null,
    image_urls: [], is_active: true, is_featured: false,
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
    product_translations: [{
      id: "t5", product_id: "5", language: "en", name: "Prism Silk",
      short_description: "Color-changing silk with built-in LED system",
      description: "<p>A stage classic, reimagined. The Prism Silk features a nano LED array embedded in genuine Japanese silk — invisible to the audience yet visible on camera.</p><ul><li>Full RGB color control via included remote</li><li>3+ hours battery life per charge</li><li>Machine washable (battery module is removable)</li></ul>",
      created_at: "2024-01-01T00:00:00Z"
    }]
  },
};

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sample = SAMPLE[slug];
  const t = sample?.product_translations[0];

  let product: ProductWithTranslations | null = null;
  let translation: ProductTranslation | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, product_translations(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    if (data) {
      product = data as unknown as ProductWithTranslations;
      translation = product.product_translations.find((tr) => tr.language === "en") ?? product.product_translations[0] ?? null;
    }
  } catch {
    // fallback to sample
  }

  const name = translation?.name ?? t?.name ?? "Product";
  const description = translation?.short_description ?? t?.short_description ?? undefined;
  const image = product?.thumbnail_url ?? undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | Mystic Lab`,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : [`${siteUrl}/og-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Mystic Lab`,
      description,
      images: image ? [image] : [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;

  let product: ProductWithTranslations | null = null;
  let options: ProductOption[] = [];
  let reviews: ReviewWithProfile[] = [];
  let solutionVideo: SolutionVideo | null = null;
  let signedVideoUrl: string | null = null;
  let isLoggedIn = false;
  let isAdmin = false;
  let hasPurchased = false;
  let hasDelivered = false;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, product_translations(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    product = data as unknown as ProductWithTranslations;

    // 구매 옵션 조회 — 함께 구매 가능한 애드온 상품 + 할인
    const { data: optionData } = await supabase
      .from("product_options")
      .select("id, linked_product_id, discount_type, discount_value, products!linked_product_id(id, slug, price_usd, is_active, product_translations(name, language))")
      .eq("product_id", product.id)
      .order("display_order", { ascending: true });
    const round2 = (n: number) => Math.round(n * 100) / 100;
    options = ((optionData ?? []) as {
      id: string; linked_product_id: string | null; discount_type: string | null; discount_value: number | null;
      products: { id: string; slug: string; price_usd: number; is_active: boolean; product_translations: { name: string; language: string }[] } | null;
    }[])
      .filter((o) => o.linked_product_id && o.products && o.products.is_active)
      .map((o) => {
        const lp = o.products!;
        const original = Number(lp.price_usd) || 0;
        const val = Number(o.discount_value) || 0;
        const price = o.discount_type === "fixed"
          ? Math.max(0, round2(original - val))
          : Math.max(0, round2(original * (1 - val / 100)));
        return {
          id: o.id,
          linked_product_id: o.linked_product_id!,
          name: lp.product_translations?.find((t) => t.language === locale)?.name
            ?? lp.product_translations?.find((t) => t.language === "en")?.name
            ?? lp.slug,
          slug: lp.slug,
          original,
          price,
        };
      });

    // 리뷰 조회 — profiles 조인은 anon RLS에 막히므로 분리: reviews(anon) + profiles(service-role 배치)
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("id, product_id, user_id, rating, comment, is_approved, created_at")
      .eq("product_id", product.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    const reviewRows = (reviewData ?? []) as Omit<ReviewWithProfile, "profiles">[];
    if (reviewRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = (await createAdminClient()) as any;
      const userIds = [...new Set(reviewRows.map((r) => r.user_id))];
      const { data: profs } = await admin
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      const profMap = new Map(
        ((profs ?? []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map((p) => [p.id, p])
      );
      reviews = reviewRows.map((r) => ({
        ...r,
        profiles: profMap.get(r.user_id) ?? null,
      })) as ReviewWithProfile[];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      isLoggedIn = true;

      const profileRes = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = (profileRes.data as { role: string } | null)?.role === "admin";

      // RLS controls access — if data comes back, user is authorized
      const { data: videoData } = await supabase
        .from("solution_videos")
        .select("*")
        .eq("product_id", product.id)
        .maybeSingle();
      solutionVideo = videoData as SolutionVideo | null;

      if (isAdmin) {
        hasPurchased = true;
        hasDelivered = true;
      } else {
        // 구매 여부 (해법영상·앱코드 접근 — 결제완료부터)
        const { data: orderItem } = await supabase
          .from("order_items")
          .select("id, orders!inner(user_id, status)")
          .eq("product_id", product.id)
          .eq("orders.user_id", user.id)
          .in("orders.status", ["paid", "shipped", "completed"])
          .limit(1)
          .maybeSingle();
        hasPurchased = !!orderItem || !!solutionVideo;

        // 배송완료 여부 (리뷰 작성 — 배송완료 주문만)
        const { data: deliveredItem } = await supabase
          .from("order_items")
          .select("id, orders!inner(user_id, status)")
          .eq("product_id", product.id)
          .eq("orders.user_id", user.id)
          .eq("orders.status", "completed")
          .limit(1)
          .maybeSingle();
        hasDelivered = !!deliveredItem;
      }

      // Generate signed playback URL server-side (avoids exposing raw stream IDs)
      if (solutionVideo?.cloudflare_stream_id) {
        signedVideoUrl = await generateSignedUrl(solutionVideo.cloudflare_stream_id);
      }
    }
  } catch {
    product = SAMPLE[slug] ?? null;
  }

  if (!product) notFound();

  const translations = product.product_translations ?? [];
  const translation =
    translations.find((t) => t.language === locale) ??
    translations.find((t) => t.language === "en") ??
    translations[0] ?? {
      id: "", product_id: product.id, language: "en",
      name: product.slug, description: "", short_description: null,
      created_at: "",
    };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: translation.name,
    description: translation.short_description ?? translation.description,
    image: product.thumbnail_url ?? `${siteUrl}/og-image.png`,
    url: `${siteUrl}/${locale}/products/${product.slug}`,
    brand: { "@type": "Brand", name: "Mystic Lab" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price_usd.toFixed(2),
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Mystic Lab" },
    },
    aggregateRating: reviews.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
          reviewCount: reviews.length,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail
        product={product}
        translation={translation}
        options={options}
        locale={locale}
        reviews={reviews}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        hasPurchased={hasPurchased}
        hasDelivered={hasDelivered}
        solutionVideo={solutionVideo}
        signedVideoUrl={signedVideoUrl}
      />
    </>
  );
}
