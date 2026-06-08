import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

function isCIAuth(req: NextRequest): boolean {
  const ciToken = process.env.FIRMWARE_CI_TOKEN;
  if (!ciToken) return false;
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  return bearer === ciToken;
}

// GET: 전체 릴리스 목록
export async function GET(req: NextRequest) {
  if (!isCIAuth(req)) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from("firmware_releases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// DELETE: 선택 항목 일괄 삭제
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids 필수" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: rows } = await (supabase as any)
    .from("firmware_releases")
    .select("storage_path")
    .in("id", ids);

  if (rows?.length) {
    const paths = rows.map((r: { storage_path: string }) => r.storage_path).filter(Boolean);
    if (paths.length) await (supabase as any).storage.from("firmware").remove(paths);
  }

  const { error } = await (supabase as any)
    .from("firmware_releases")
    .delete()
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: ids.length });
}

// POST: 업로드 완료 후 메타데이터 저장
export async function POST(req: NextRequest) {
  if (!isCIAuth(req)) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { device_type, version, notes, storage_path, download_url, file_size } = await req.json();
  if (!device_type?.trim() || !version?.trim() || !storage_path || !download_url) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 빌드 완료 → 대기 행(빈 URL) 먼저 정리
  await (supabase as any)
    .from("firmware_releases")
    .delete()
    .eq("device_type", device_type.trim())
    .eq("version", version.trim())
    .eq("download_url", "");

  const { data, error } = await (supabase as any)
    .from("firmware_releases")
    .insert({
      device_type: device_type.trim(),
      version: version.trim(),
      notes: notes?.trim() || null,
      storage_path,
      download_url,
      file_size: file_size ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
