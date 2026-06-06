import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { translatePromoPage } from "@/lib/auto-translate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb() { return (await createAdminClient()) as any; }

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const { data, error } = await db
    .from("promo_pages")
    .select("id, slug, title, subtitle, description, image_url, badge_text, coupon_id, is_active, ends_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { slug, title, subtitle, description, image_url, badge_text, coupon_id, ends_at } = body;

  if (!slug || !title) return NextResponse.json({ error: "slug와 제목은 필수입니다." }, { status: 400 });

  const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!cleanSlug) return NextResponse.json({ error: "유효하지 않은 슬러그입니다." }, { status: 400 });

  const titleTrim = String(title).trim();
  const subtitleTrim = subtitle ? String(subtitle).trim() : null;
  const descTrim = description ? String(description).trim() : null;

  // 자동번역 (실패해도 저장은 진행)
  const translations = await translatePromoPage({ title: titleTrim, subtitle: subtitleTrim, description: descTrim });

  const db = await getDb();
  const { data, error } = await db
    .from("promo_pages")
    .insert({
      slug: cleanSlug,
      title: titleTrim,
      subtitle: subtitleTrim,
      description: descTrim,
      image_url: image_url ? String(image_url).trim() : null,
      badge_text: badge_text ? String(badge_text).trim() : null,
      coupon_id: coupon_id || null,
      ends_at: ends_at || null,
      translations: Object.keys(translations).length ? translations : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (String(error.message ?? "").includes("unique") || String(error.code ?? "").includes("23505")) {
      return NextResponse.json({ error: "이미 사용 중인 슬러그입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id, slug, title, subtitle, description, image_url, badge_text, coupon_id, ends_at, is_active } = body;
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (slug !== undefined) {
    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!cleanSlug) return NextResponse.json({ error: "유효하지 않은 슬러그" }, { status: 400 });
    update.slug = cleanSlug;
  }
  if (title !== undefined) update.title = String(title).trim();
  if (subtitle !== undefined) update.subtitle = subtitle ? String(subtitle).trim() : null;
  if (description !== undefined) update.description = description ? String(description).trim() : null;
  if (image_url !== undefined) update.image_url = image_url ? String(image_url).trim() : null;
  if (badge_text !== undefined) update.badge_text = badge_text ? String(badge_text).trim() : null;
  if (coupon_id !== undefined) update.coupon_id = coupon_id || null;
  if (ends_at !== undefined) update.ends_at = ends_at || null;
  if (is_active !== undefined) update.is_active = Boolean(is_active);

  // 내용 변경 시 자동번역 재실행 (title/subtitle/description 중 하나라도 바뀌면)
  if (title !== undefined || subtitle !== undefined || description !== undefined) {
    const titleVal = (update.title ?? title ?? "") as string;
    if (titleVal) {
      const tr = await translatePromoPage({ title: titleVal, subtitle: update.subtitle as string | null, description: update.description as string | null });
      if (Object.keys(tr).length) update.translations = tr;
    }
  }

  const db = await getDb();
  const { error } = await db.from("promo_pages").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

  const db = await getDb();
  const { error } = await db.from("promo_pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
