import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { issueCoupon, issuePublicCoupon } from "@/lib/coupons";

// GET — 최근 발급 쿠폰 목록(개인+공개)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { data, error } = await supabase
    .from("issued_coupons")
    .select("id, code, email, user_id, type, value, source, scope, max_uses, per_user_limit, used_count, is_active, min_order_usd, is_used, starts_at, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — 쿠폰 발급. scope='public'면 공개 쿠폰(다회·비로그인), 그 외엔 개인 쿠폰(이메일 1회용).
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    scope?: "personal" | "public";
    email?: string;
    code?: string;
    type?: "percent" | "fixed";
    value?: number;
    maxUses?: number | null;
    perUserLimit?: number | null;
    minOrderUsd?: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    expiresMonths?: number | null;
  };

  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0 || (type === "percent" && value > 100)) {
    return NextResponse.json({ error: "할인 값이 올바르지 않습니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  // 공개 쿠폰 — 소유자 없음·다회용(구 discount_codes 대체).
  if (body.scope === "public") {
    const reqCode = body.code?.trim();
    if (reqCode && !/^[A-Za-z0-9-]{3,32}$/.test(reqCode)) {
      return NextResponse.json({ error: "코드는 영문/숫자/하이픈 3~32자만 가능합니다." }, { status: 400 });
    }
    const code = await issuePublicCoupon(supabase, {
      code: reqCode || undefined,
      type, value,
      maxUses: body.maxUses == null ? null : Number(body.maxUses),
      perUserLimit: body.perUserLimit == null ? null : Number(body.perUserLimit),
      minOrderUsd: body.minOrderUsd ?? 0,
      startsAt: body.startsAt || null,
      expiresAt: body.expiresAt || null,
    });
    if (!code) return NextResponse.json({ error: "발급에 실패했습니다. (코드 중복일 수 있습니다)" }, { status: 500 });
    return NextResponse.json({ ok: true, code }, { status: 201 });
  }

  // 개인 쿠폰 — 특정 이메일에게 1회용.
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "유효한 이메일을 입력해주세요." }, { status: 400 });
  }
  // 이메일→회원 매칭(있으면 연결)
  let userId: string | null = null;
  try {
    const { data } = await supabase.rpc("get_user_id_by_email", { p_email: email });
    if (data) userId = data as string;
  } catch { /* RPC 미배포 — 이메일 기반으로만 발급 */ }

  const code = await issueCoupon(supabase, {
    userId, email, type, value,
    source: "manual",
    minOrderUsd: body.minOrderUsd ?? 0,
    expiresMonths: body.expiresMonths === undefined ? 6 : body.expiresMonths,
  });
  if (!code) return NextResponse.json({ error: "발급에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, code }, { status: 201 });
}
