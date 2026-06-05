import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST — 공개 쿠폰을 회원 계정에 발급(claim). 발급해야 체크아웃에서 사용 가능.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { code } = await request.json().catch(() => ({}));
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "코드가 필요합니다." }, { status: 400 });
  }
  const codeU = code.toUpperCase().trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const now = new Date();

  const { data: c } = await admin
    .from("issued_coupons")
    .select("id, scope, is_active, starts_at, expires_at, max_uses, used_count")
    .eq("code", codeU)
    .maybeSingle();

  if (!c || c.scope !== "public") return NextResponse.json({ error: "발급 가능한 쿠폰이 아닙니다." }, { status: 404 });
  if (c.is_active === false) return NextResponse.json({ error: "발급이 중단된 쿠폰입니다." }, { status: 400 });
  if (c.starts_at && new Date(c.starts_at) > now) return NextResponse.json({ error: "아직 발급 기간이 아닙니다." }, { status: 400 });
  if (c.expires_at && new Date(c.expires_at) < now) return NextResponse.json({ error: "만료된 쿠폰입니다." }, { status: 400 });
  if (c.max_uses != null && (c.used_count ?? 0) >= c.max_uses) return NextResponse.json({ error: "마감된 쿠폰입니다." }, { status: 400 });

  // 발급 — 회원당 1회(UNIQUE). 이미 발급받았으면(중복) 성공으로 간주.
  const { error } = await admin.from("coupon_claims").insert({ coupon_id: c.id, user_id: user.id });
  if (error && !String(error.message ?? "").toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: "발급에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
