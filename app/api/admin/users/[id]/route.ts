import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [profileRes, ordersRes, grantsRes, authRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, status, suspension_reason, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("orders")
      .select(`
        id, status, total_usd, created_at,
        order_items(id, quantity, price_usd,
          products(slug, product_translations(name, language))
        )
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("manual_video_grants")
      .select(`
        id, note, expires_at, created_at,
        products(id, slug, product_translations(name, language))
      `)
      .eq("user_id", id),
    supabase.auth.admin.getUserById(id),
  ]);

  return NextResponse.json({
    profile: profileRes.data,
    email: authRes.data?.user?.email ?? null,
    orders: ordersRes.data ?? [],
    grants: grantsRes.data ?? [],
  });
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json() as { status?: string; suspension_reason?: string; admin_notes?: string; role?: string };

  if (body.status && !["active", "suspended", "banned", "dormant"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (body.role !== undefined && !["user", "admin"].includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.suspension_reason !== undefined) update.suspension_reason = body.suspension_reason;
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes;
  if (body.role !== undefined) update.role = body.role;

  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
