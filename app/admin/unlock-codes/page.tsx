import { createAdminClient } from "@/lib/supabase/server";
import UnlockCodesManager from "@/components/admin/UnlockCodesManager";
import { decryptCode } from "@/lib/crypto/unlock-code";

export const metadata = { title: "잠금해제 코드 — Admin" };

interface RawProduct {
  id: string;
  slug: string;
  product_translations: { name: string; language: string }[];
}

interface RawCode {
  id: string;
  product_id: string;
  created_at: string;
  first_used_at: string | null;
  code_plain: string | null;
  active_token_hash: string | null;
  last_activated_at: string | null;
  user_id: string | null;
  activation_count: number | null;
  max_activations: number | null;
  is_locked: boolean | null;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

function pickName(translations: { name: string; language: string }[] | undefined, slug: string): string {
  return (
    translations?.find((t) => t.language === "ko")?.name ??
    translations?.find((t) => t.language === "en")?.name ??
    slug
  );
}

export default async function AdminUnlockCodesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [productsRes, codesRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, slug, product_translations(name, language)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_unlock_codes")
      .select(
        "id, product_id, created_at, first_used_at, code_plain, active_token_hash, last_activated_at, user_id, activation_count, max_activations, is_locked, products(slug, product_translations(name, language))"
      )
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const products = ((productsRes.data ?? []) as RawProduct[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: pickName(p.product_translations, p.slug),
  }));

  const rawCodes = (codesRes.data ?? []) as RawCode[];

  // 회원 코드의 소유자 이름 조회 (user_id → display_name)
  const userIds = Array.from(new Set(rawCodes.map((c) => c.user_id).filter((id): id is string => !!id)));
  const memberNames = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of (profiles ?? []) as { id: string; display_name: string | null }[]) {
      if (p.display_name) memberNames.set(p.id, p.display_name);
    }
  }

  const codes = rawCodes.map((c) => ({
    id: c.id,
    product_id: c.product_id,
    product_slug: c.products?.slug ?? "",
    created_at: c.created_at,
    first_used_at: c.first_used_at,
    code_plain: decryptCode(c.code_plain),
    is_activated: !!c.active_token_hash,
    last_activated_at: c.last_activated_at,
    is_member: !!c.user_id,
    member_name: c.user_id ? memberNames.get(c.user_id) ?? null : null,
    product_name: pickName(c.products?.product_translations, c.products?.slug ?? "알 수 없음"),
    activation_count: c.activation_count ?? 0,
    max_activations: c.max_activations ?? null,
    is_locked: !!c.is_locked,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF" }}>
        잠금해제 코드 관리
      </h1>
      <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
        상품별 정품 인증 코드를 수동 발급하고, 발급된 코드의 기기 등록 현황을 관리합니다.
        코드 1개당 단말기 1대만 활성화되며, 신규 코드는 기본 <b className="text-[#A855F7]">5회</b>까지만 기기 활성화(교체)가 허용됩니다(무한 공유 방지).
        한도 초과 시 &ldquo;리셋&rdquo;, 즉시 차단은 &ldquo;잠금&rdquo;, 등록 기기만 풀려면 &ldquo;기기 해제&rdquo;를 사용하세요. 회원 구매 시에는 코드가 자동 발급됩니다.
      </p>
      <UnlockCodesManager products={products} codes={codes} />
    </div>
  );
}
