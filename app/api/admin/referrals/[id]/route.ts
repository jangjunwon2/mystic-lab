import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const admin = await createAdminClient();

  const ALLOWED = ["code", "discount_type", "discount_value", "notes", "is_active", "max_uses", "reward_type", "reward_value"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("referral_codes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("referral_codes")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
