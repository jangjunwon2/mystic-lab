import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH: 게시/미노출(is_approved) 토글 및 신고 해제(is_reported)
export async function PATCH(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json() as { is_approved?: boolean };

  // 허용 필드 화이트리스트 (게시/미노출)
  const updatePayload: Record<string, boolean> = {};
  if (typeof body.is_approved === "boolean") updatePayload.is_approved = body.is_approved;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase
    .from("reviews")
    .update(updatePayload)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "리뷰 업데이트에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: 리뷰 삭제
export async function DELETE(_req: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
