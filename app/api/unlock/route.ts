import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { generateSignedUrl } from "@/lib/cloudflare/stream";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

type UnlockCode = {
  id: string;
  product_id: string;
  first_used_at: string | null;
  is_locked: boolean | null;
  activation_count: number | null;
  max_activations: number | null;
  user_id: string | null;
  last_activated_at: string | null;
};

type SolutionVideoRow = {
  cloudflare_stream_id: string;
  title: string | null;
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const allowed = await checkRateLimit(`unlock:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { code, productId } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 4) {
      return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
    }

    const codeHash = createHash("sha256").update(trimmedCode).digest("hex");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    let codeQuery = supabase
      .from("product_unlock_codes")
      .select("id, product_id, first_used_at, is_locked, activation_count, max_activations, user_id, last_activated_at")
      .eq("code_hash", codeHash);

    if (productId) {
      codeQuery = codeQuery.eq("product_id", productId);
    }

    const { data: unlockCode, error } = await codeQuery.maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!unlockCode) {
      return NextResponse.json({ error: "Invalid code. Please check again." }, { status: 404 });
    }

    const uc = unlockCode as UnlockCode;

    // Fetch product details to check if it's an app
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("slug, is_digital")
      .eq("id", uc.product_id)
      .maybeSingle();

    if (prodError) {
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    const isApp =
      !!product?.is_digital ||
      product?.slug === "magic-calculator" ||
      product?.slug === "fake-instagram";

    let deviceToken: string | null = null;

    if (isApp) {
      // 1-1. 관리자 잠금 / 활성화 한도 검사 (무한 재활성화·공유 악용 방지)
      if (uc.is_locked) {
        return NextResponse.json(
          { error: "관리자에 의해 비활성화된 코드입니다. 판매처에 문의해 주세요." },
          { status: 403 }
        );
      }

      const maxActivations: number | null = uc.max_activations;
      const activationCount: number = uc.activation_count ?? 0;

      // 24시간 이내 기기 재등록 시 횟수 차감 방지 (캐시/쿠키 삭제 등으로 인한 무분별한 횟수 소모 보호)
      const lastActivated = uc.last_activated_at ? new Date(uc.last_activated_at) : null;
      const isRecent = lastActivated && (Date.now() - lastActivated.getTime() < 24 * 60 * 60 * 1000);

      if (maxActivations != null && activationCount >= maxActivations && !isRecent) {
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
        if (user && !uc.user_id) {
          assignUserId = user.id;
        }
      } catch {
        // 비로그인/세션 오류 — 귀속 없이 진행
      }

      // 2. 단일 활성 디바이스용 새 고유 토큰 생성
      deviceToken = randomBytes(32).toString("hex");
      const newDeviceTokenHash = createHash("sha256").update(deviceToken).digest("hex");

      const nextActivationCount = isRecent ? activationCount : activationCount + 1;

      // DB 업데이트
      const { error: updateError } = await supabase
        .from("product_unlock_codes")
        .update({
          active_token_hash: newDeviceTokenHash,
          last_activated_at: new Date().toISOString(),
          activation_count: nextActivationCount,
          first_used_at: uc.first_used_at || new Date().toISOString(),
          ...(assignUserId ? { user_id: assignUserId } : {}),
        })
        .eq("id", uc.id);

      if (updateError) {
        return NextResponse.json({ error: "기기 인증 상태 업데이트 실패" }, { status: 500 });
      }
    } else {
      // Standard product: Mark first use if not already marked
      if (!uc.first_used_at) {
        await supabase
          .from("product_unlock_codes")
          .update({ first_used_at: new Date().toISOString() })
          .eq("id", uc.id);
      }
    }

    // Get solution video
    const { data: solutionVideo } = await supabase
      .from("solution_videos")
      .select("cloudflare_stream_id, title")
      .eq("product_id", uc.product_id)
      .maybeSingle();

    const sv = solutionVideo as SolutionVideoRow | null;

    // Generate signed URL if video exists
    const signedUrl = sv?.cloudflare_stream_id
      ? await generateSignedUrl(sv.cloudflare_stream_id)
      : null;

    // Set a 30-day session cookie so user doesn't have to re-enter the code
    const THIRTY_DAYS = 30 * 24 * 60 * 60;
    const response = NextResponse.json({
      success: true,
      productId: uc.product_id,
      productSlug: product?.slug ?? null,
      isApp,
      signedUrl,
      videoTitle: sv?.title ?? null,
    });

    const cookieOpts = {
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // 1. 일반 unlock 쿠키
    response.cookies.set(`ml_unlock_${uc.product_id}`, "granted", cookieOpts);

    // 2. 앱 전용 기기 토큰 쿠키
    if (isApp && deviceToken) {
      response.cookies.set(`ml_dt_${uc.product_id}`, deviceToken, cookieOpts);
      if (product?.slug === "magic-calculator") {
        response.cookies.set("ml_calc_device_token", deviceToken, cookieOpts);
      }
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
