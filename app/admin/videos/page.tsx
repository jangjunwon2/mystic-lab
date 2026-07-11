import { createAdminClient } from "@/lib/supabase/server";
import VideosAdminManager from "@/components/admin/VideosAdminManager";

export const metadata = { title: "Videos — Admin" };

interface RawVideo {
  id: string;
  cloudflare_stream_id: string;
  title: string | null;
  created_at: string;
  products: { id: string; slug: string; product_translations: { name: string; language: string }[] } | null;
}

interface RawChapter {
  id: string;
  video_id: string;
  timestamp_seconds: number;
  video_chapter_translations: { language: string; description: string }[];
}

interface RawProduct {
  id: string;
  slug: string;
  product_translations: { name: string; language: string }[];
}

export default async function AdminVideosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [videosRes, productsRes, chaptersRes] = await Promise.all([
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
    supabase
      .from("video_chapters")
      .select("id, video_id, timestamp_seconds, video_chapter_translations(language, description)")
      .order("timestamp_seconds", { ascending: true }),
  ]);

  const chaptersByVideo = new Map<string, { id: string; timestamp_seconds: number; description_ko: string }[]>();
  for (const c of (chaptersRes.data ?? []) as RawChapter[]) {
    const list = chaptersByVideo.get(c.video_id) ?? [];
    list.push({
      id: c.id,
      timestamp_seconds: c.timestamp_seconds,
      description_ko: c.video_chapter_translations.find((t) => t.language === "ko")?.description ?? "",
    });
    chaptersByVideo.set(c.video_id, list);
  }

  const videos = ((videosRes.data ?? []) as RawVideo[]).map((v) => ({
    id: v.id,
    cloudflare_stream_id: v.cloudflare_stream_id,
    title: v.title,
    created_at: v.created_at,
    product_id: v.products?.id ?? null,
    product_name:
      v.products?.product_translations?.find((t) => t.language === "ko")?.name ??
      v.products?.product_translations?.find((t) => t.language === "en")?.name ??
      v.products?.slug ?? "Unknown",
    chapters: chaptersByVideo.get(v.id) ?? [],
  }));

  const products = ((productsRes.data ?? []) as RawProduct[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    name:
      p.product_translations?.find((t) => t.language === "ko")?.name ??
      p.product_translations?.find((t) => t.language === "en")?.name ??
      p.slug,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>
        해법 영상
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        Cloudflare Stream 영상 ID를 상품에 연결합니다. 구매 확인 회원만 접근 가능한 비공개 해법 영상입니다.
      </p>
      <VideosAdminManager videos={videos} products={products} />
    </div>
  );
}
