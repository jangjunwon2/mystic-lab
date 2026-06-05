import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { issueCoupon } from "@/lib/coupons";

// GET — 최근 발급 쿠폰 목록
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { data, error } = await supabase
    .from("issued_coupons")
    .select("id, code, email, user_id, type, value, source, min_order_usd, is_used, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — 특정 회원/이메일에게 쿠폰 수동 발급
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    email?: string;
    type?: "percent" | "fixed";
    value?: number;
    minOrderUsd?: number;
    expiresMonths?: number | null;
  };

  const email = body.email?.trim().toLowerCase();
  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "유효한 이메일을 입력해주세요." }, { status: 400 });
  }
  if (!Number.isFinite(value) || value <= 0 || (type === "percent" && value > 100)) {
    return NextResponse.json({ error: "할인 값이 올바르지 않습니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
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
