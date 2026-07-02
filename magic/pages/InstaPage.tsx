import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { userOwnsProduct } from "@/lib/product-access";
import FakeInstagramApp from "@/magic/components/FakeInstagramApp";
import ClientPwaWrapper from "@/magic/components/ClientPwaWrapper";
import AppUnlockForm from "@/magic/components/AppUnlockForm";

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
  if (!product) return { authorized: false, productId: null, shouldRedirect: false };

  const cookieStore = await cookies();
  const token = cookieStore.get(`ml_dt_${product.id}`)?.value;
  
  if (!token) {
    // 쿠키 유실 시 로그인 사용자의 자동 인증 복구 분기
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
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: activeCode } = await supabase
      .from("product_unlock_codes")
      .select("id")
      .eq("active_token_hash", tokenHash)
      .eq("product_id", product.id)
      .maybeSingle();

    if (activeCode) {
      return { authorized: true, productId: product.id, shouldRedirect: false };
    }

    // 쿠키가 있으나 유효하지 않은 경우 자동 복구 분기
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
    return { authorized: false, productId: product.id, shouldRedirect: false };
  }
}

export default async function InstaPage({ params }: Props) {
  const { locale } = await params;
  const { authorized, shouldRedirect, productId } = await verifyDeviceActivation();

  if (shouldRedirect) {
    redirect(`/api/magic/auto-activate?slug=${SLUG}&next=/${locale}/insta`);
  }

  if (!authorized) {
    const tc = await getTranslations("calc");
    const tu = await getTranslations("unlock");
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-6 text-center select-text">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (sessionStorage.getItem("ml_insta_restore_attempted")) {
                    return;
                  }
                  var dtToken = null;
                  var dtKey = null;
                  
                  for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf("ml_dt_") === 0) {
                      dtKey = key;
                      dtToken = localStorage.getItem(key);
                      break;
                    }
                  }
                  
                  if (dtToken) {
                    sessionStorage.setItem("ml_insta_restore_attempted", "true");
                    var secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
                    
                    if (dtKey && dtToken) {
                      document.cookie = dtKey + "=" + dtToken + "; path=/; max-age=2592000; SameSite=Lax" + secureSuffix;
                    }
                    window.location.reload();
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
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
          <AppUnlockForm
            productId={productId!}
            locale={locale}
            slug={SLUG}
            productUrl={`/${locale}/products/${SLUG}`}
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

  return (
    <ClientPwaWrapper locale={locale} appName="Instagram">
      <FakeInstagramApp locale={locale} />
    </ClientPwaWrapper>
  );
}
