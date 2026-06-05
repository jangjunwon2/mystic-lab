import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 스팸 방지 — IP당 시간당 5회
  if (!(await checkRateLimit(`newsletter:${getClientIP(request)}`, 5, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests. Please try later." }, { status: 429 });
  }

  const { email, locale, source } = (await request.json()) as {
    email: string;
    locale?: string;
    source?: string;
  };

  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("newsletter_subscribers")
    .upsert(
      {
        email: trimmed,
        locale: locale ?? "en",
        is_active: true,
        source: source ?? "footer",
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    );

  if (error) return NextResponse.json({ error: "Subscription failed. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
