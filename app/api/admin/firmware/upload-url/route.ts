import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

// 어드민이 Supabase Storage에 직접 업로드할 수 있는 서명된 URL 발급
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { device_type, version, filename } = await req.json();
  if (!device_type?.trim() || !version?.trim() || !filename?.trim()) {
    return NextResponse.json({ error: "device_type, version, filename 필수" }, { status: 400 });
  }

  const storagePath = `${device_type}/${version}/${filename}`;
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .storage
    .from("firmware")
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
