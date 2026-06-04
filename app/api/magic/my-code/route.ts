import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { encryptCode, decryptCode } from "@/lib/crypto/unlock-code";

// 회원에게 노출되는 정품 인증 코드 형식: MC-XXXX-XXXX (대문자/숫자, 혼동 문자 제외)
function generateMemberCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[randomBytes(1)[0] % chars.length]).join("");
  return `MC-${seg()}-${seg()}`;
}

// 회원이 구매한 magic 상품의 인증 코드를 조회(없으면 자동 발급)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { productId } = (await request.json()) as { productId?: string };
  if (!productId) return NextResponse.json({ error: "상품 ID가 필요합니다." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  // 1. 구매 확인 (결제완료/배송중/완료 주문)
  const { data: orderItem } = await admin
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", productId)
    .eq("orders.user_id", user.id)
    .in("orders.status", ["paid", "shipped", "completed"])
    .limit(1)
    .maybeSingle();

  let hasAccess = !!orderItem;
  if (!hasAccess) {
    const { data: grant } = await admin
      .from("manual_video_grants")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    hasAccess = !!grant;
  }
  if (!hasAccess) {
    return NextResponse.json({ error: "구매 내역이 없습니다." }, { status: 403 });
  }

  // 2. 이미 발급된 회원 코드가 있으면 그대로 반환
  const { data: existing } = await admin
    .from("product_unlock_codes")
    .select("code_plain")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing?.code_plain) {
    return NextResponse.json({ code: decryptCode(existing.code_plain) });
  }

  // 3. 신규 자동 발급
  const plain = generateMemberCode();
  const codeHash = createHash("sha256").update(plain).digest("hex");
  const { error } = await admin.from("product_unlock_codes").insert({
    product_id: productId,
    code_hash: codeHash,
    code_plain: encryptCode(plain),
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: "코드 발급에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ code: plain });
}
