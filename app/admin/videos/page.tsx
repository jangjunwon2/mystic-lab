import { createAdminClient } from "@/lib/supabase/server";
import VideosAdminManager from "@/components/admin/VideosAdminManager";

export const metadata = { title: "영상 관리 — Admin" };

interface RawVideo {
  id: string;
  cloudflare_stream_id: string;
  title: string | null;
  created_at: string;
  products: { id: string; slug: string; product_translations: { name: string; language: string }[] } | null;
}

interface RawProduct {
  id: string;
  slug: string;
  product_translations: { name: string; language: string }[];
}

export default async function AdminVideosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [videosRes, productsRes] = await Promise.all([
    supabase
      .from("solution_videos")
      .select(`
        id, cloudflare_stream_id, title, created_at,
        products(id, slug, product_translations(name, language))
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, slug, product_translations(name, language)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const videos = ((videosRes.data ?? []) as RawVideo[]).map((v) => ({
    id: v.id,
    cloudflare_stream_id: v.cloudflare_stream_id,
    title: v.title,
    created_at: v.created_at,
    product_id: v.products?.id ?? null,
    product_name:
      v.products?.product_translations?.find((t) => t.language === "en")?.name ?? v.products?.slug ?? "Unknown",
  }));

  const products = ((productsRes.data ?? []) as RawProduct[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.product_translations?.find((t) => t.language === "en")?.name ?? p.slug,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>
        영상 관리
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        Link Cloudflare Stream video IDs to products. These are the secret &quot;how-to&quot; videos.
      </p>
      <VideosAdminManager videos={videos} products={products} />
    </div>
  );
}
