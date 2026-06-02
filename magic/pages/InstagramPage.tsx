import { cookies } from "next/headers";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import FakeInstagram from "@/magic/components/FakeInstagram";

interface Props {
  params: Promise<{ locale: string }>;
}

async function verifyDeviceActivation() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ml_calc_device_token")?.value;

  if (!token) {
    return { authorized: false };
  }

  try {
    // 1. 토큰 해시 처리
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 2. Supabase Admin Client 생성 (RLS 우회)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // 3. 마술 계산기 상품 조회 (slug가 magic-calculator인 제품)
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("slug", "magic-calculator")
      .maybeSingle();

    if (!product) {
      return { authorized: false };
    }

    // 4. active_token_hash 매칭 조회
    const { data: activeCode } = await supabase
      .from("product_unlock_codes")
      .select("id")
      .eq("active_token_hash", tokenHash)
      .eq("product_id", product.id)
      .maybeSingle();

    if (activeCode) {
      return { authorized: true };
    }

    return { authorized: false };
  } catch {
    return { authorized: false };
  }
}

export default async function InstagramPage({ params }: Props) {
  const { locale } = await params;
  const { authorized } = await verifyDeviceActivation();

  // 미인증 시 접근 차단 페이지 렌더링
  if (!authorized) {
    const isKo = locale === "ko";
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-6 text-center select-text">
        <div className="max-w-md w-full rounded-2xl border border-[#2D2D4E] bg-[#1A1A2E] p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
            <span className="text-2xl text-[#EF4444]">⚠</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>
              {isKo ? "정품 기기 등록 필요" : "Device Activation Required"}
            </h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              {isKo
                ? "이 단말기는 등록되지 않았거나, 다른 스마트폰에서 인증이 진행되어 권한이 만료되었습니다. 미스틱랩 홈페이지의 상품 상세 페이지 하단에서 정품 기기 등록을 먼저 진행해 주세요."
                : "This device is not activated, or its authorization has expired because the code was used to register another smartphone. Please register your device on the product detail page first."}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/${locale}/products/magic-calculator`}
              className="inline-flex w-full items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
            >
              {isKo ? "미스틱랩 상품 페이지로 이동" : "Go to Product Page"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 인증 성공 시 페이크 인스타그램 렌더링
  return <FakeInstagram locale={locale} />;
}
