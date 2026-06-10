import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  if (!(await checkRateLimit(`profile-patch:${getClientIP(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = (body?.display_name as string | undefined)?.trim();
  if (!name || name.length > 50) {
    return NextResponse.json({ error: "Name must be 1–50 characters." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
