import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateSignedUrl } from "@/lib/cloudflare/stream";
import SolutionVideoSection from "@/components/video/SolutionVideoSection";
import TutorialPlaylistPlayer from "@/components/video/TutorialPlaylistPlayer";
import type { VideoChapter } from "@/components/video/VideoChapters";
import type { Metadata } from "next";

type RawVideoChapter = {
  id: string;
  timestamp_seconds: number;
  video_chapter_translations: { language: string; description: string }[];
};

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const titles: Record<string, string> = {
    en: "Solution Tutorial",
    ko: "해법 영상",
    ja: "解法チュートリアル",
    "zh-CN": "解法教程",
    es: "Tutorial de Solución",
    fr: "Tutoriel de Solution",
    de: "Lösungs-Tutorial",
  };
  return {
    title: `${titles[locale] ?? titles.en} — ${slug}`,
    robots: { index: false, follow: false },
  };
}

function pickName(translations: { name: string; language: string }[] | undefined, locale: string, slug: string): string {
  return (
    translations?.find((t) => t.language === locale)?.name ??
    translations?.find((t) => t.language === "en")?.name ??
    translations?.[0]?.name ??
    slug
  );
}

// 해법 영상 전용 시청 페이지 — 상세 페이지를 거치지 않고 바로 영상 재생
export default async function TutorialPage({ params }: Props) {
  const { locale, slug } = await params;
  const tt = await getTranslations("tutorial");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/sign-in?redirect=/${locale}/tutorials/${slug}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  const { data: product } = await admin
    .from("products")
    .select("id, slug, product_translations(name, language)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) notFound();

  // 접근 권한: 관리자 / 구매(결제완료+)
  const { data: prof } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = (prof as { role?: string } | null)?.role === "admin";

  let hasPurchased = isAdmin;
  if (!hasPurchased) {
    const { data: orderItem } = await admin
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", product.id)
      .eq("orders.user_id", user.id)
      .in("orders.status", ["paid", "shipped", "completed"])
      .limit(1)
      .maybeSingle();
    hasPurchased = !!orderItem;
  }
  if (!hasPurchased) {
    const { data: grant } = await admin
      .from("manual_video_grants")
      .select("id, expires_at")
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (grant && (!grant.expires_at || new Date(grant.expires_at) > new Date())) {
      hasPurchased = true;
    }
  }

  const { data: videos } = await admin
    .from("solution_videos")
    .select("id, cloudflare_stream_id, title, part_order")
    .eq("product_id", product.id)
    .order("part_order", { ascending: true })
    .order("created_at", { ascending: true });

  // 미구매자는 상품 상세로 돌려보냄 (구매 유도)
  if (!hasPurchased && (!videos || videos.length === 0)) {
    redirect(`/${locale}/products/${slug}`);
  }

  const name = pickName(product.product_translations, locale, slug);

  // 재생목록 아이템 구축
  const playlist = [];
  if (hasPurchased && videos && videos.length > 0) {
    for (const video of videos) {
      const signedUrl = video.cloudflare_stream_id
        ? await generateSignedUrl(video.cloudflare_stream_id)
        : null;

      let chapters: VideoChapter[] = [];
      if (signedUrl) {
        const { data: chapterRows } = await admin
          .from("video_chapters")
          .select("id, timestamp_seconds, video_chapter_translations(language, description)")
          .eq("video_id", video.id)
          .order("timestamp_seconds", { ascending: true });

        chapters = ((chapterRows ?? []) as RawVideoChapter[]).map((c) => ({
          id: c.id,
          timestampSeconds: c.timestamp_seconds,
          description:
            c.video_chapter_translations.find((tr) => tr.language === locale)?.description ??
            c.video_chapter_translations.find((tr) => tr.language === "en")?.description ??
            c.video_chapter_translations[0]?.description ??
            "",
        }));
      }

      playlist.push({
        id: video.id,
        title: video.title,
        part_order: video.part_order,
        signedUrl,
        chapters,
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href={`/${locale}/account`}
          className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          {tt("myLibrary")}
        </Link>

        <h1
          className="text-2xl font-bold text-[#F0E6FF] mb-6"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {name}
        </h1>

        {playlist.length > 0 ? (
          <TutorialPlaylistPlayer
            productId={product.id}
            locale={locale}
            currentUserId={user.id}
            hasPurchased={hasPurchased}
            playlist={playlist}
            name={name}
          />
        ) : (
          <SolutionVideoSection
            isLoggedIn
            isAdmin={isAdmin}
            hasPurchased={hasPurchased}
            signedUrl={null}
            videoTitle={null}
            locale={locale}
            productSlug={slug}
          />
        )}
      </div>
    </div>
  );
}
