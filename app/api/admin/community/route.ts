import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getCommunityPostsForAdmin } from "@/lib/community-admin";

// GET — 전 상품 커뮤니티 글 + 댓글(어드민 관리용)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const posts = await getCommunityPostsForAdmin(supabase);
  return NextResponse.json(posts);
}

// PATCH — 글/댓글 수정. body { kind:"post"|"comment", id, body, title? }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const kind = body?.kind;
  const id = body?.id as string;
  const newBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!id || (kind !== "post" && kind !== "comment") || !newBody) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const table = kind === "post" ? "product_posts" : "product_post_comments";
  const update: Record<string, unknown> = { body: newBody };
  if (kind === "post" && body?.title !== undefined) {
    update.title = typeof body.title === "string" ? body.title.trim() || null : null;
  }

  const { error } = await supabase.from(table).update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — 글/댓글 삭제. body { kind:"post"|"comment", id }
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const kind = body?.kind;
  const id = body?.id as string;
  if (!id || (kind !== "post" && kind !== "comment")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const table = kind === "post" ? "product_posts" : "product_post_comments";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
