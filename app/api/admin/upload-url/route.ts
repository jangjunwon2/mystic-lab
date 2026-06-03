import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

import { createDirectUploadUrl, isUploadConfigured } from "@/lib/cloudflare/stream";

/**
 * POST /api/admin/upload-url
 * Returns a Cloudflare Stream direct upload URL so the browser can upload a video file directly.
 * In mock mode (no CF credentials), returns { mock: true }.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isUploadConfigured()) {
    return NextResponse.json({ mock: true, message: "Cloudflare Stream not configured — set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_TOKEN." });
  }

  const result = await createDirectUploadUrl();
  if (!result) {
    return NextResponse.json({ error: "Failed to create upload URL from Cloudflare." }, { status: 502 });
  }

  return NextResponse.json(result);
}
