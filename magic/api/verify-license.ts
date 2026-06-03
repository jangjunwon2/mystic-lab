import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  // 인증 시도는 IP당 분당 10회로 제한
  if (!checkRateLimit(`verify-license:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
  }

  try {
    const { code, productId } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "인증 코드를 입력해주세요." }, { status: 400 });
    }

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "상품 ID가 필요합니다." }, { status: 400 });
    }

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      return NextResponse.json({ error: "유효하지 않은 코드 형식입니다." }, { status: 400 });
    }

    const codeHash = createHash("sha256").update(trimmed).digest("hex");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // 1. 해당 코드 존재 여부 및 productId와 일치하는지 조회
    const { data: unlockCode, error: queryError } = await supabase
      .from("product_unlock_codes")
      .select("id, product_id")
      .eq("code_hash", codeHash)
      .eq("product_id", productId)
      .maybeSingle();

    if (queryError) {
      return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }

    if (!unlockCode) {
      return NextResponse.json({ error: "유효하지 않은 코드이거나 이 상품의 코드가 아닙니다." }, { status: 404 });
    }

    // 2. 단일 활성 디바이스용 새 고유 토큰 생성
    const newDeviceToken = randomBytes(32).toString("hex");
    const newDeviceTokenHash = createHash("sha256").update(newDeviceToken).digest("hex");

    // DB에 활성 토큰 해시 및 마지막 활성화 시각 업데이트
    const { error: updateError } = await supabase
      .from("product_unlock_codes")
      .update({
        active_token_hash: newDeviceTokenHash,
        last_activated_at: new Date().toISOString(),
      })
      .eq("id", unlockCode.id);

    if (updateError) {
      return NextResponse.json({ error: "기기 인증 상태 업데이트 실패" }, { status: 500 });
    }

    // 3. 응답 생성 및 쿠키 주입
    const response = NextResponse.json({
      success: true,
      productId: unlockCode.product_id,
      deviceToken: newDeviceToken,
    });

    // 일반 unlock 쿠키 (30일 유효)
    response.cookies.set(`ml_unlock_${unlockCode.product_id}`, "granted", {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    // 계산기 기기 잠금용 고유 토큰 쿠키 (30일 유효)
    response.cookies.set(`ml_calc_device_token`, newDeviceToken, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
