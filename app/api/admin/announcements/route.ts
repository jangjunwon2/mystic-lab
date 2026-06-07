import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { translateAnnouncement } from "@/lib/auto-translate";

const AnnouncementSchema = z.object({
  message: z.string().min(1).max(500),
  link_url: z.string().url().optional().nullable(),
  link_label: z.string().max(60).optional().nullable(),
  is_active: z.boolean().optional(),
  starts_at: z.string().datetime({ offset: true }).optional().nullable(),
  ends_at: z.string().datetime({ offset: true }).optional().nullable(),
  coupon_code: z.string().max(32).optional().nullable(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = AnnouncementSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 입력값입니다." },
      { status: 400 }
    );
  }

  const { message, link_url, link_label, is_active, starts_at, ends_at, coupon_code } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const translations = await translateAnnouncement(message);

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      message,
      link_url: link_url ?? null,
      link_label: link_label ?? null,
      is_active: is_active ?? true,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
      coupon_code: coupon_code ?? null,
      translations: Object.keys(translations).length ? translations : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
