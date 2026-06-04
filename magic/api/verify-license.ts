import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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
      .select("id, product_id, user_id, is_locked, activation_count, max_activations")
      .eq("code_hash", codeHash)
      .eq("product_id", productId)
      .maybeSingle();

    if (queryError) {
      return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }

    if (!unlockCode) {
      return NextResponse.json({ error: "유효하지 않은 코드이거나 이 상품의 코드가 아닙니다." }, { status: 404 });
    }

    // 1-1. 관리자 잠금 / 활성화 한도 검사 (무한 재활성화·공유 악용 방지)
    if (unlockCode.is_locked) {
      return NextResponse.json({ error: "관리자에 의해 비활성화된 코드입니다. 판매처에 문의해 주세요." }, { status: 403 });
    }
    const maxActivations: number | null = unlockCode.max_activations;
    const activationCount: number = unlockCode.activation_count ?? 0;
    if (maxActivations != null && activationCount >= maxActivations) {
      return NextResponse.json(
        { error: "이 코드의 기기 활성화 가능 횟수를 초과했습니다. 판매처에 문의해 주세요." },
        { status: 403 }
      );
    }

    // 1-2. 로그인 상태이고 코드가 아직 회원에 미할당(수동 발급)이면 현재 로그인 회원에게 자동 귀속
    let assignUserId: string | null = null;
    try {
      const ssr = await createClient();
      const { data: { user } } = await ssr.auth.getUser();
      if (user && !unlockCode.user_id) {
        assignUserId = user.id;
      }
    } catch {
      // 비로그인/세션 오류 — 귀속 없이 진행
    }

    // 2. 단일 활성 디바이스용 새 고유 토큰 생성
    const newDeviceToken = randomBytes(32).toString("hex");
    const newDeviceTokenHash = createHash("sha256").update(newDeviceToken).digest("hex");

    // DB에 활성 토큰 해시·마지막 활성화 시각·활성화 횟수(+1) 업데이트 (+ 미할당 코드면 로그인 회원에 귀속)
    const { error: updateError } = await supabase
      .from("product_unlock_codes")
      .update({
        active_token_hash: newDeviceTokenHash,
        last_activated_at: new Date().toISOString(),
        activation_count: activationCount + 1,
        ...(assignUserId ? { user_id: assignUserId } : {}),
      })
      .eq("id", unlockCode.id);

    if (updateError) {
      return NextResponse.json({ error: "기기 인증 상태 업데이트 실패" }, { status: 500 });
    }

    // 상품 slug 조회 (계산기 레거시 쿠키 호환 판단용)
    const { data: prod } = await supabase
      .from("products")
      .select("slug")
      .eq("id", unlockCode.product_id)
      .maybeSingle();
    const slug: string | null = prod?.slug ?? null;

    // 3. 응답 생성 및 쿠키 주입
    const response = NextResponse.json({
      success: true,
      productId: unlockCode.product_id,
      deviceToken: newDeviceToken,
    });

    const cookieOpts = { maxAge: 30 * 24 * 60 * 60, httpOnly: true, sameSite: "lax" as const, path: "/" };

    // 일반 unlock 쿠키
    response.cookies.set(`ml_unlock_${unlockCode.product_id}`, "granted", cookieOpts);

    // 상품별 기기 토큰 쿠키 (앱 게이트가 상품별로 대조)
    response.cookies.set(`ml_dt_${unlockCode.product_id}`, newDeviceToken, cookieOpts);

    // 계산기는 기존 게이트가 ml_calc_device_token 을 읽으므로 호환 유지 (계산기 상품에만 설정)
    if (slug === "magic-calculator") {
      response.cookies.set("ml_calc_device_token", newDeviceToken, cookieOpts);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
