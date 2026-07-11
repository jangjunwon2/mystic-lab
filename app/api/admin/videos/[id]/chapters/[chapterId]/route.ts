import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string; chapterId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: videoId, chapterId } = await context.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase
    .from("video_chapters")
    .delete()
    .eq("id", chapterId)
    .eq("video_id", videoId);
  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
