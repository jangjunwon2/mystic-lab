import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

// POST — 상품 조회수 기록. { productId, locale } 를 받아 product_views에 INSERT.
export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(`track-view:${getClientIP(request)}`, 60, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const { productId, locale } = await request.json().catch(() => ({}));
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (await createAdminClient()) as any;
    await db.from("product_views").insert({
      product_id: productId,
      locale: typeof locale === "string" ? locale.slice(0, 10) : "en",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
