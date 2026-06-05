import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // 로그인 사용자만 — 비로그인 호출로 코드 사용횟수를 소진(무력화)하는 것 방지
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { codeId } = await request.json();
  if (!codeId || typeof codeId !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  await supabase.rpc("increment_discount_used", { code_id: codeId });

  return NextResponse.json({ ok: true });
}
