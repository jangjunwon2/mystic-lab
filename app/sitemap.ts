import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"];
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/products",
    "/custom-order",
    "/about",
    "/contact",
    "/shipping",
    "/unlock",
    "/sign-in",
    "/sign-up",
  ];

  const staticUrls: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${BASE}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1.0 : 0.8,
    }))
  );

  // Dynamic product pages
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: products } = await (supabase as any)
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true);

    if (products) {
      productUrls = LOCALES.flatMap((locale) =>
        products.map((p: { slug: string; updated_at: string }) => ({
          url: `${BASE}/${locale}/products/${p.slug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.9,
        }))
      );
    }
  } catch { /* non-critical */ }

  return [...staticUrls, ...productUrls];
}
