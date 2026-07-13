import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const supabase = createAdminClient();

  const ALLOWED_FIELDS = ["notes", "download_url", "device_type", "version", "is_active"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key];
  }

  // 만약 특정 버전을 배포 활성화(is_active = true) 하는 경우, 동일 장치타입의 타 버전들을 전부 비활성화 처리
  if (patch.is_active === true) {
    const { data: release } = await (supabase as any)
      .from("firmware_releases")
      .select("device_type")
      .eq("id", id)
      .single();

    if (release?.device_type) {
      await (supabase as any)
        .from("firmware_releases")
        .update({ is_active: false })
        .eq("device_type", release.device_type);
    }
  }

  const { error } = await (supabase as any)
    .from("firmware_releases")
    .update(patch)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from("firmware_releases")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (data?.storage_path) {
    const { error: storageErr } = await (supabase as any).storage.from("firmware").remove([data.storage_path]);
    if (storageErr) console.error("[firmware/delete] storage removal failed:", data.storage_path, storageErr.message);
  }

  const { error } = await (supabase as any)
    .from("firmware_releases")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
