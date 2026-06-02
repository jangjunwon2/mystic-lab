import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
  return (profile as { role?: string } | null)?.role === "admin" ? user : null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json() as {
    status?: string;
    tracking_number?: string;
    tracking_carrier?: string;
  };

  const update: Record<string, string> = {};

  if (body.status !== undefined) {
    const valid = ["pending", "paid", "shipped", "completed", "refunded"];
    if (!valid.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.tracking_number !== undefined) {
    update.tracking_number = body.tracking_number.trim();
  }
  if (body.tracking_carrier !== undefined) {
    update.tracking_carrier = body.tracking_carrier.trim();
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { error } = await supabase.from("orders").update(update).eq("id", id);

  if (error) return NextResponse.json({ error: "주문 업데이트 중 오류가 발생했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
