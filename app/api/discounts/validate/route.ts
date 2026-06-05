import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 코드 브루트포스 방지 — IP당 분당 10회
  if (!(await checkRateLimit(`discount-validate:${getClientIP(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const { code, totalUsd } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "코드를 입력해주세요." }, { status: 400 });
  }

  const codeUpper = code.toUpperCase().trim();
  const subtotal = typeof totalUsd === "number" ? totalUsd : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // 1) 할인 코드 우선 조회
  const { data } = await supabase
    .from("discount_codes")
    .select("id, code, type, value, max_uses, used_count, expires_at")
    .eq("code", codeUpper)
    .eq("is_active", true)
    .maybeSingle();

  if (data) {
    const row = data as {
      id: string;
      code: string;
      type: "percent" | "fixed";
      value: number;
      max_uses: number | null;
      used_count: number;
      expires_at: string | null;
    };

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: "만료된 할인 코드입니다." }, { status: 400 });
    }

    if (row.max_uses !== null && row.used_count >= row.max_uses) {
      return NextResponse.json({ error: "사용 한도가 초과된 코드입니다." }, { status: 400 });
    }

    const discountAmount =
      row.type === "percent"
        ? Math.round(subtotal * (row.value / 100) * 100) / 100
        : Math.min(row.value, subtotal);

    return NextResponse.json({
      valid: true,
      kind: "discount",
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value,
      discountAmount,
    });
  }

  // 2) 레퍼럴(제휴) 코드 — 할인 코드에 없으면 조회. 구매자에게 정률(%) 할인.
  //    사용횟수 증가는 결제 성공 시 save-order에서 서버측으로 처리(멱등).
  const { data: referral } = await supabase
    .from("referral_codes")
    .select("id, code, discount_percent")
    .eq("code", codeUpper)
    .eq("is_active", true)
    .maybeSingle();

  if (referral) {
    const r = referral as { id: string; code: string; discount_percent: number };
    const discountAmount = Math.round(subtotal * (r.discount_percent / 100) * 100) / 100;
    return NextResponse.json({
      valid: true,
      kind: "referral",
      id: r.id,
      code: r.code,
      type: "percent",
      value: r.discount_percent,
      discountAmount,
    });
  }

  return NextResponse.json({ error: "유효하지 않은 할인 코드입니다." }, { status: 404 });
}
