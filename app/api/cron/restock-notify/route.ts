import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRestockNotification } from "@/lib/resend";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || !secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: alerts, error } = await supabase
    .from("restock_alerts")
    .select("id, email, product_id, products(slug, stock, product_translations(name, language))")
    .is("notified_at", null)
    .limit(100);

  if (error) {
    console.error("[restock-notify] fetch error:", error.message);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  const toMark: string[] = [];
  let sent = 0;

  for (const alert of (alerts ?? []) as unknown as {
    id: string;
    email: string;
    product_id: string;
    products: {
      slug: string;
      stock: number;
      product_translations: { name: string; language: string }[];
    } | null;
  }[]) {
    const product = alert.products;
    if (!product || product.stock <= 0) continue;

    const translations = product.product_translations ?? [];
    const name =
      translations.find((t) => t.language === "en")?.name ??
      translations.find((t) => t.language === "ko")?.name ??
      translations[0]?.name ??
      product.slug;

    const ok = await sendRestockNotification({
      to: alert.email,
      productName: name,
      productSlug: product.slug,
    }).then(() => true).catch((e) => { console.error("[restock-notify] send failed:", e); return false; });

    // Mark regardless of email success to prevent infinite retry spam on persistent failure.
    toMark.push(alert.id);
    if (ok) sent++;
  }

  if (toMark.length > 0) {
    await supabase
      .from("restock_alerts")
      .update({ notified_at: new Date().toISOString() })
      .in("id", toMark);
  }

  return NextResponse.json({ sent });
}
