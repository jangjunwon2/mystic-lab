import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

import { createHash, randomBytes } from "crypto";
import { encryptCode } from "@/lib/crypto/unlock-code";

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

  const { id, action, product_id, max_activations } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // 기기 바인딩 강제 해제 — 등록된 단말기 권한 즉시 취소 (횟수는 유지)
  if (action === "release") {
    const { error } = await supabase
      .from("product_unlock_codes")
      .update({ active_token_hash: null, last_activated_at: null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "기기 해제에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 활성화 횟수 리셋 — 한도 초과로 막힌 코드를 다시 사용 가능하게 (잠금도 해제)
  if (action === "reset") {
    const { error } = await supabase
      .from("product_unlock_codes")
      .update({ activation_count: 0, is_locked: false })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "횟수 리셋에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 잠금 / 잠금 해제 — 잠금 시 등록된 기기 권한도 즉시 취소
  if (action === "lock" || action === "unlock") {
    const locked = action === "lock";
    const { error } = await supabase
      .from("product_unlock_codes")
      .update(locked ? { is_locked: true, active_token_hash: null } : { is_locked: false })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "잠금 상태 변경에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 활성화 한도 설정 (빈값/0 이하 → 무제한)
  if (max_activations !== undefined) {
    const parsed = Number(max_activations);
    const value = Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
    const { error } = await supabase
      .from("product_unlock_codes")
      .update({ max_activations: value })
      .eq("id", id);
    if (error) return NextResponse.json({ error: "한도 설정에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true, max_activations: value });
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
    .insert({ product_id, code_hash: codeHash, code_plain: encryptCode(plainCode) })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: (data as { id: string }).id, code: plainCode }, { status: 201 });
}
