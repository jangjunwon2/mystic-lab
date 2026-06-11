import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { saveProductOptions } from "@/lib/admin/save-product-options";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { slug, category, price_usd, stock, is_active, is_featured, is_digital, thumbnail_url, demo_video_cloudflare_id, image_urls, translations, options } = (body ?? {}) as Record<string, unknown>;

  if (!slug || !category || price_usd == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      slug,
      category,
      price_usd,
      stock: stock ?? 0,
      is_active: is_active ?? true,
      is_featured: is_featured ?? false,
      is_digital: is_digital ?? false,
      thumbnail_url: thumbnail_url ?? null,
      demo_video_cloudflare_id: demo_video_cloudflare_id ?? null,
      image_urls: image_urls ?? [],
    })
    .select("id")
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }

  if (Array.isArray(translations) && translations.length > 0) {
    const rows = translations.map((t: { language: string; name: string; description: string; short_description?: string }) => ({
      product_id: (product as { id: string }).id,
      language: t.language,
      name: t.name,
      description: t.description,
      short_description: t.short_description ?? null,
    }));
    await supabase.from("product_translations").insert(rows);
  }

  if (Array.isArray(options) && options.length > 0) {
    await saveProductOptions(supabase, (product as { id: string }).id, options);
  }

  return NextResponse.json({ id: (product as { id: string }).id }, { status: 201 });
}
