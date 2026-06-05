import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

// DELETE — 쿠폰 임의 삭제(만료 전에도). coupon_products/categories는 FK CASCADE로 함께 삭제.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { error } = await supabase.from("issued_coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — 정지/재개(is_active 토글). body { is_active: boolean }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const isActive = body?.is_active;
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "is_active(boolean)가 필요합니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { error } = await supabase.from("issued_coupons").update({ is_active: isActive }).eq("id", id);
  if (error) return NextResponse.json({ error: "변경에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, is_active: isActive });
}
