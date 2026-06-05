import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getPointEarnRate, setSetting } from "@/lib/settings";

// GET — 현재 설정값(포인트 적립률 등)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const pointEarnRate = await getPointEarnRate(supabase);
  return NextResponse.json({ pointEarnRate });
}

// POST — 설정 저장. body { pointEarnRate: number(0~1) }
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const rate = Number(body?.pointEarnRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    return NextResponse.json({ error: "적립률은 0~1 사이여야 합니다." }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const ok = await setSetting(supabase, "point_earn_rate", String(rate));
  if (!ok) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, pointEarnRate: rate });
}
