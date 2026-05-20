import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { product_id, locale } = (await request.json()) as {
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
