import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

// PATCH: 활성/비활성 토글
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { is_active } = await req.json();

  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from("firmware_releases")
    .update({ is_active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: 릴리스 삭제 (Storage 파일도 함께)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  // storage_path 조회
  const { data: rel } = await (supabase as any)
    .from("firmware_releases")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (rel?.storage_path) {
    await (supabase as any).storage.from("firmware").remove([rel.storage_path]);
  }

  const { error } = await (supabase as any)
    .from("firmware_releases")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
