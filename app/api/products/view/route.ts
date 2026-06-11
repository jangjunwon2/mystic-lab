import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(`product-view:${getClientIP(request)}`, 60, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  const { product_id, locale } = body as {
    product_id: string;
    locale?: string;
  };

  if (!product_id) return NextResponse.json({ ok: false });

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("product_views").insert({
    product_id,
    locale: locale ?? "en",
  });

  return NextResponse.json({ ok: true });
}
