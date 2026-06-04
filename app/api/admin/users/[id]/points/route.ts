import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { addPoints, spendPoints, getPointsBalance } from "@/lib/points";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST { amount, note } — 회원 포인트 수동 지급(+)/차감(-)
export async function POST(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await ctx.params;
  const { amount, note } = (await request.json()) as { amount?: number; note?: string };

  const amt = Math.trunc(Number(amount));
  if (!amt || !Number.isFinite(amt) || Math.abs(amt) > 1_000_000) {
    return NextResponse.json({ error: "유효한 포인트 값을 입력하세요 (±1,000,000 이내)." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  if (amt < 0) {
    // 차감 — 잔액 음수 방지 후 FIFO 소진
    const balance = await getPointsBalance(supabase, userId);
    if (balance + amt < 0) {
      return NextResponse.json({ error: `잔액 부족 (현재 ${balance}P)` }, { status: 400 });
    }
    const spent = await spendPoints(supabase, {
      userId,
      amount: -amt,
      type: "adjust",
      note: note?.trim() || "관리자 조정",
    });
    if (spent <= 0) return NextResponse.json({ error: "포인트 처리에 실패했습니다." }, { status: 500 });
  } else {
    // 지급 — 12개월 만료 로트 생성
    const ok = await addPoints(supabase, {
      userId,
      amount: amt,
      type: "adjust",
      note: note?.trim() || "관리자 조정",
    });
    if (!ok) return NextResponse.json({ error: "포인트 처리에 실패했습니다." }, { status: 500 });
  }

  const balance = await getPointsBalance(supabase, userId);
  return NextResponse.json({ ok: true, balance });
}
