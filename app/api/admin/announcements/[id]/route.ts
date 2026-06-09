import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { translateAnnouncement } from "@/lib/auto-translate";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (body.message !== undefined) {
    if (typeof body.message !== "string" || body.message.length === 0 || body.message.length > 500)
      return NextResponse.json({ error: "message는 1~500자여야 합니다." }, { status: 400 });
    patch.message = body.message;
  }
  if (body.link_url !== undefined) patch.link_url = body.link_url ?? null;
  if (body.link_label !== undefined) patch.link_label = body.link_label ?? null;
  if (body.is_active !== undefined) patch.is_active = !!body.is_active;
  if (body.starts_at !== undefined) patch.starts_at = body.starts_at ?? null;
  if (body.ends_at !== undefined) patch.ends_at = body.ends_at ?? null;
  if (body.coupon_code !== undefined) patch.coupon_code = body.coupon_code ?? null;

  // message가 변경되면 자동번역 재실행
  if (typeof patch.message === "string") {
    const translations = await translateAnnouncement(patch.message);
    if (Object.keys(translations).length) patch.translations = translations;
  }

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase.from("announcements").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
