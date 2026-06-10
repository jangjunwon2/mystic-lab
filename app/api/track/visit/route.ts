import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

// POST — 일일 방문자 기록. session_id는 클라이언트가 localStorage에서 생성(하루 1회).
export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(`track-visit:${getClientIP(request)}`, 5, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    const { sessionId } = await request.json().catch(() => ({}));
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (await createAdminClient()) as any;
    // UPSERT — PK(date, session_id)로 중복 무시
    await db.from("site_visits").upsert({ date: today, session_id: sessionId }, { onConflict: "date,session_id", ignoreDuplicates: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
