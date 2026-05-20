import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { codeId } = await request.json();
  if (!codeId) return NextResponse.json({ ok: false }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  await supabase.rpc("increment_discount_used", { code_id: codeId });

  return NextResponse.json({ ok: true });
}
