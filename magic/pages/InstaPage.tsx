import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import FakeInstagramApp from "@/magic/components/FakeInstagramApp";
import ClientPwaWrapper from "@/magic/components/ClientPwaWrapper";

interface Props {
  params: Promise<{ locale: string }>;
}

const SLUG = "fake-instagram";

// 기기 활성화 검증 — fake-instagram 상품의 per-product 토큰 쿠키(ml_dt_<productId>) 대조
async function verifyDeviceActivation() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();
  if (!product) return { authorized: false, productId: null };

  const cookieStore = await cookies();
  const token = cookieStore.get(`ml_dt_${product.id}`)?.value;
  if (!token) return { authorized: false, productId: product.id };

  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: activeCode } = await supabase
      .from("product_unlock_codes")
      .select("id")
      .eq("active_token_hash", tokenHash)
      .eq("product_id", product.id)
      .maybeSingle();
    return { authorized: !!activeCode, productId: product.id };
  } catch {
    return { authorized: false, productId: product.id };
  }
}

export default async function InstaPage({ params }: Props) {
  const { locale } = await params;
  const { authorized } = await verifyDeviceActivation();

  if (!authorized) {
    const tc = await getTranslations("calc");
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
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{tc("blockBody")}</p>
          </div>
          <div className="pt-2">
            <Link
              href={`/${locale}/products/${SLUG}`}
              className="inline-flex w-full items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
            >
              {tc("goToProduct")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientPwaWrapper locale={locale} appName="Instagram">
      <FakeInstagramApp locale={locale} />
    </ClientPwaWrapper>
  );
}
