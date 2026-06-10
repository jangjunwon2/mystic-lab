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

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// DELETE: 선택 항목 일괄 삭제
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let ids: string[] | undefined;
  try {
    ({ ids } = await req.json() as { ids: string[] });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
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

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: ids.length });
}

// POST: GitHub Actions 빌드 완료 후 릴리스 등록
export async function POST(req: NextRequest) {
  if (!isCIAuth(req)) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { device_type, version, notes, storage_path, download_url, file_size } = body as { device_type?: string; version?: string; notes?: string; storage_path?: string; download_url?: string; file_size?: number };
  if (!device_type?.trim() || !version?.trim() || !storage_path || !download_url) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // pending 행(download_url="")을 장치+버전으로 직접 UPDATE
  // 매칭 실패(0 rows) → 사용자가 이미 다른 버전을 올렸거나 이미 완료됨 → stale build 무시
  const { data: updated } = await (supabase as any)
    .from("firmware_releases")
    .update({
      download_url,
      storage_path,
      file_size: file_size ?? null,
      notes: notes?.trim() || null,
    })
    .eq("device_type", device_type.trim())
    .eq("version", version.trim())
    .eq("download_url", "")
    .select("id, device_type, version, download_url, storage_path, file_size, notes, created_at, is_active")
    .single();

  if (!updated) {
    return NextResponse.json({ skipped: true, reason: "no matching pending row for this version" });
  }

  // 같은 장치의 다른 행(구 릴리스) 정리
  await (supabase as any)
    .from("firmware_releases")
    .delete()
    .eq("device_type", device_type.trim())
    .neq("id", updated.id);

  return NextResponse.json(updated);
}
