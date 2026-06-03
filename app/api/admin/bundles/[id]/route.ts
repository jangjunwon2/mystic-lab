import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH { is_active } — 활성/비활성 토글
export async function PATCH(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { is_active } = (await request.json()) as { is_active?: boolean };
  if (typeof is_active !== "boolean") {
    return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { error } = await supabase.from("bundles").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — 세트 삭제 (bundle_items는 CASCADE)
export async function DELETE(_request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { error } = await supabase.from("bundles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
