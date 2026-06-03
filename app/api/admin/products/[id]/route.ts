import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { slug, category, price_usd, stock, is_active, is_featured, is_digital, thumbnail_url, demo_video_cloudflare_id, image_urls, translations } = body;

  const updatePayload: Record<string, unknown> = {};
  if (slug !== undefined) updatePayload.slug = slug;
  if (category !== undefined) updatePayload.category = category;
  if (price_usd !== undefined) updatePayload.price_usd = price_usd;
  if (stock !== undefined) updatePayload.stock = stock;
  if (is_active !== undefined) updatePayload.is_active = is_active;
  if (is_featured !== undefined) updatePayload.is_featured = is_featured;
  if (is_digital !== undefined) updatePayload.is_digital = is_digital;
  if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url;
  if (demo_video_cloudflare_id !== undefined) updatePayload.demo_video_cloudflare_id = demo_video_cloudflare_id;
  if (image_urls !== undefined) updatePayload.image_urls = image_urls;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (translations?.length > 0) {
    for (const t of translations as { language: string; name: string; description: string; short_description?: string }[]) {
      await supabase.from("product_translations").upsert(
        {
          product_id: id,
          language: t.language,
          name: t.name,
          description: t.description,
          short_description: t.short_description ?? null,
        },
        { onConflict: "product_id,language" }
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
