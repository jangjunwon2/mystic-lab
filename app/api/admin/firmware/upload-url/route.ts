import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

function isCIAuth(req: NextRequest): boolean {
  const ciToken = process.env.FIRMWARE_CI_TOKEN;
  if (!ciToken) return false;
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!bearer || bearer.length !== ciToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(bearer), Buffer.from(ciToken));
}

// 어드민 또는 GitHub Actions CI가 Supabase Storage 서명 URL을 발급받는 엔드포인트
export async function POST(req: NextRequest) {
  if (!isCIAuth(req)) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { device_type, version, filename } = (body ?? {}) as { device_type?: string; version?: string; filename?: string };
  if (!device_type?.trim() || !version?.trim() || !filename?.trim()) {
    return NextResponse.json({ error: "device_type, version, filename 필수" }, { status: 400 });
  }

  const SAFE = /^[a-z0-9_.-]{1,64}$/i;
  if (!SAFE.test(device_type) || !SAFE.test(version) || !SAFE.test(filename)) {
    return NextResponse.json({ error: "경로에 허용되지 않는 문자가 포함되어 있습니다." }, { status: 400 });
  }

  const storagePath = `${device_type}/${version}/${filename}`;
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .storage
    .from("firmware")
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // 공개 다운로드 URL
  const { data: pubData } = (supabase as any)
    .storage
    .from("firmware")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl: pubData.publicUrl,
  });
}
