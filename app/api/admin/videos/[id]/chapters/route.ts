import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { translateVideoChapter } from "@/lib/auto-translate";

const ChapterSchema = z.object({
  timestamp_seconds: z.number().int().min(0),
  description: z.string().min(1).max(500),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: videoId } = await context.params;

  const json = await request.json().catch(() => null);
  const parsed = ChapterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 입력값입니다." },
      { status: 400 }
    );
  }
  const { timestamp_seconds, description } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: chapter, error: chapterError } = await supabase
    .from("video_chapters")
    .insert({ video_id: videoId, timestamp_seconds })
    .select("id, timestamp_seconds")
    .single();
  if (chapterError) return NextResponse.json({ error: "Request failed." }, { status: 500 });

  const translations = await translateVideoChapter(description);
  const rows = [
    { chapter_id: chapter.id, language: "ko", description },
    ...Object.entries(translations).map(([language, text]) => ({
      chapter_id: chapter.id,
      language,
      description: text,
    })),
  ];

  const { error: translationsError } = await supabase
    .from("video_chapter_translations")
    .insert(rows);
  if (translationsError) {
    await supabase.from("video_chapters").delete().eq("id", chapter.id);
    return NextResponse.json({ error: "Translation save failed." }, { status: 500 });
  }

  return NextResponse.json(
    { chapter: { id: chapter.id, timestamp_seconds: chapter.timestamp_seconds, description } },
    { status: 201 }
  );
}
