import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { userOwnsProduct } from "@/lib/product-access";
import MagicCalculator from "@/magic/components/MagicCalculator";
import ClientPwaWrapper from "@/magic/components/ClientPwaWrapper";
import AppUnlockForm from "@/magic/components/AppUnlockForm";

interface Props {
  params: Promise<{ locale: string }>;
}

async function verifyDeviceActivation() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  // 3. 마술 계산기 상품 조회 (slug가 magic-calculator인 제품)
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", "magic-calculator")
    .maybeSingle();

  if (!product) {
    return { authorized: false, productId: null, shouldRedirect: false };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("ml_calc_device_token")?.value;

  if (!token) {
    // 쿠키가 없는 경우, 로그인 회원의 구매 여부를 검사해 자동 활성화 분기 처리
    try {
      const ssr = await createClient();
      const { data: { user } } = await ssr.auth.getUser();
      if (user) {
        const owns = await userOwnsProduct(supabase, user.id, product.id);
        if (owns) {
          return { authorized: false, productId: product.id, shouldRedirect: true };
        }
      }
    } catch {
      // ignore
    }
    return { authorized: false, productId: product.id, shouldRedirect: false };
  }

  try {
    // 1. 토큰 해시 처리
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 4. active_token_hash 매칭 조회
    const { data: activeCode } = await supabase
      .from("product_unlock_codes")
      .select("id")
      .eq("active_token_hash", tokenHash)
      .eq("product_id", product.id)
      .maybeSingle();

    if (activeCode) {
      return { authorized: true, productId: product.id, shouldRedirect: false };
    }

    // 쿠키가 있지만 매칭되지 않는 경우(다른 기기 활성화 등으로 유효하지 않음), 로그인 회원이면 자동 갱신 리다이렉트
    try {
      const ssr = await createClient();
      const { data: { user } } = await ssr.auth.getUser();
      if (user) {
        const owns = await userOwnsProduct(supabase, user.id, product.id);
        if (owns) {
          return { authorized: false, productId: product.id, shouldRedirect: true };
        }
      }
    } catch {
      // ignore
    }

    return { authorized: false, productId: product.id, shouldRedirect: false };
  } catch {
    return { authorized: false, productId: null, shouldRedirect: false };
  }
}

export default async function CalculatorPage({ params }: Props) {
  const { locale } = await params;
  const { authorized, productId, shouldRedirect } = await verifyDeviceActivation();

  if (shouldRedirect) {
    redirect(`/api/magic/auto-activate?slug=magic-calculator&next=/${locale}/calc`);
  }

  // 미인증 시 접근 차단 페이지 렌더링
  if (!authorized) {
    const tc = await getTranslations("calc");
    const tu = await getTranslations("unlock");
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-6 text-center select-text">
        <div className="max-w-md w-full rounded-2xl border border-[#2D2D4E] bg-[#1A1A2E] p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
            <span className="text-2xl text-[#EF4444]">⚠</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>
              {tc("blockTitle")}
            </h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              {tc("blockBody")}
            </p>
          </div>

          <AppUnlockForm
            productId={productId!}
            locale={locale}
            slug="magic-calculator"
            productUrl={productId ? `/${locale}/products/magic-calculator` : `/${locale}/products`}
            translations={{
              placeholder: tu("codePlaceholder") || "인증 코드 입력",
              submit: tc("maRegister") || "인증하기",
              checking: tc("maRegistering") || "인증 중…",
              goToProduct: tc("goToProduct"),
            }}
          />
        </div>
      </div>
    );
  }

  // 인증 성공 시 클라이언트 PWA 래퍼 및 마술 계산기 서빙
  return (
    <ClientPwaWrapper locale={locale}>
      <MagicCalculator locale={locale} productId={productId!} />
    </ClientPwaWrapper>
  );
}
