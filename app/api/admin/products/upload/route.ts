import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${maxSizeMB}MB)` }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF allowed" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `products/${fileName}`;

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  // 매직바이트 검증 — 확장자/MIME 위조 차단(실제 이미지 시그니처 확인)
  const s = buffer;
  const isJpeg = s[0] === 0xff && s[1] === 0xd8 && s[2] === 0xff;
  const isPng = s[0] === 0x89 && s[1] === 0x50 && s[2] === 0x4e && s[3] === 0x47;
  const isGif = s[0] === 0x47 && s[1] === 0x49 && s[2] === 0x46;
  const isWebp =
    s[0] === 0x52 && s[1] === 0x49 && s[2] === 0x46 && s[3] === 0x46 &&
    s[8] === 0x57 && s[9] === 0x45 && s[10] === 0x42 && s[11] === 0x50;
  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return NextResponse.json({ error: "File content is not a valid image." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    if (error.message?.includes("Bucket not found") || error.statusCode === "404") {
      return NextResponse.json({
        error: "Storage bucket 'product-images' not found. Please create it in Supabase Dashboard → Storage.",
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
