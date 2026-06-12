import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

const ALLOWED_DEVICES = /^[a-z0-9_-]{1,50}$/;

// 공개 엔드포인트 — ESP32 기기가 최신 펌웨어 버전 확인
// GET /api/firmware/latest?device=my-device-type
export async function GET(req: NextRequest) {
  if (!(await checkRateLimit(`firmware-latest:${getClientIP(req)}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const device = req.nextUrl.searchParams.get("device") ?? "";
  if (!device || !ALLOWED_DEVICES.test(device)) {
    return NextResponse.json({ error: "Invalid device parameter." }, { status: 400 });
  }

  const supabase = createAdminClient();
  // download_url이 빈 문자열인 pending(빌드 대기) 행은 기기에 반환하지 않음
  // 빌드 중에는 이전 완료 버전 또는 404를 반환 — 빈 URL로 OTA 시도하면 기기가 오류 발생
  const { data, error } = await (supabase as any)
    .from("firmware_releases")
    .select("id, version, download_url, notes, created_at, file_size")
    .eq("device_type", device)
    .neq("download_url", "")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No firmware found" }, { status: 404 });

  return NextResponse.json({
    version: data.version,
    url: data.download_url,
    file_size: data.file_size,
    released_at: data.created_at,
  });
}
