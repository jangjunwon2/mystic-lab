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
