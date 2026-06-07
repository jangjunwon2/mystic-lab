import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// 공개 엔드포인트 — ESP32 기기가 최신 펌웨어 버전 확인
// GET /api/firmware/latest?device=my-device-type
export async function GET(req: NextRequest) {
  const device = req.nextUrl.searchParams.get("device") ?? "default";

  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from("firmware_releases")
    .select("id, version, download_url, notes, created_at, file_size")
    .eq("device_type", device)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No firmware found" }, { status: 404 });

  return NextResponse.json({
    version: data.version,
    url: data.download_url,
    notes: data.notes,
    file_size: data.file_size,
    released_at: data.created_at,
  });
}
