import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: 영상 접근 권한 수동 부여
export async function POST(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await ctx.params;
  const body = await request.json() as {
    product_id: string;
    note?: string;
    expires_at?: string | null;
  };

  if (!body.product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data, error } = await supabase
    .from("manual_video_grants")
    .upsert({
      user_id: userId,
      product_id: body.product_id,
      granted_by: admin.id,
      note: body.note ?? null,
      expires_at: body.expires_at ?? null,
    }, { onConflict: "user_id,product_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: 영상 접근 권한 회수
export async function DELETE(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const grantId = searchParams.get("grant_id");

  if (!grantId) return NextResponse.json({ error: "grant_id required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase
    .from("manual_video_grants")
    .delete()
    .eq("id", grantId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
