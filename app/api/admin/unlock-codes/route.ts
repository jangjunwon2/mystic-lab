import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

import { createHash, randomBytes } from "crypto";

function generatePlainCode(): string {
  // Format: XXXX-XXXX-XXXX (alphanumeric uppercase, easy to type)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomChar = () => chars[randomBytes(1)[0] % chars.length];
  const segment = () => Array.from({ length: 4 }, randomChar).join("");
  return `${segment()}-${segment()}-${segment()}`;
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase
    .from("product_unlock_codes")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, product_id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // 기기 바인딩 강제 해제 — 등록된 단말기 권한 즉시 취소
  if (action === "release") {
    const { error } = await supabase
      .from("product_unlock_codes")
      .update({ active_token_hash: null, last_activated_at: null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "기기 해제에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 상품 재지정
  if (product_id) {
    const { error } = await supabase
      .from("product_unlock_codes")
      .update({ product_id })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "상품 변경에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action 또는 product_id가 필요합니다." }, { status: 400 });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await request.json();
  if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  const plainCode = generatePlainCode();
  const codeHash = createHash("sha256").update(plainCode).digest("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data, error } = await supabase
    .from("product_unlock_codes")
    .insert({ product_id, code_hash: codeHash, code_plain: plainCode })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: (data as { id: string }).id, code: plainCode }, { status: 201 });
}
