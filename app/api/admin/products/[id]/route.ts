import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { saveProductOptions } from "@/lib/admin/save-product-options";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { slug, category, price_usd, stock, is_active, is_featured, is_digital, thumbnail_url, demo_video_cloudflare_id, image_urls, translations, options, point_earn_rate } = body as Record<string, unknown>;

  if (slug !== undefined && (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug) || slug.length > 100)) {
    return NextResponse.json({ error: "Invalid slug format." }, { status: 400 });
  }
  if (price_usd !== undefined && (!Number.isFinite(price_usd) || price_usd <= 0)) {
    return NextResponse.json({ error: "price_usd must be > 0." }, { status: 400 });
  }
  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
    return NextResponse.json({ error: "stock must be >= 0." }, { status: 400 });
  }

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
  // null = 전역 적립률 사용, 숫자 = 해당 상품 전용 적립률
  if (point_earn_rate !== undefined) updatePayload.point_earn_rate = point_earn_rate === null ? null : Number(point_earn_rate);

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
    if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }

  if (translations?.length > 0) {
    await supabase.from("product_translations").upsert(
      (translations as { language: string; name: string; description: string; short_description?: string }[]).map((t) => ({
        product_id: id,
        language: t.language,
        name: t.name,
        description: t.description,
        short_description: t.short_description ?? null,
      })),
      { onConflict: "product_id,language" }
    );
  }

  // 옵션은 전달 시 전체 교체(삭제 후 재삽입 — product_option_items는 CASCADE). undefined면 건드리지 않음.
  if (options !== undefined) {
    await supabase.from("product_options").delete().eq("product_id", id);
    if (Array.isArray(options) && options.length > 0) {
      await saveProductOptions(supabase, id, options);
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
  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
