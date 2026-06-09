import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const ALLOWED_FIELDS = ["notes", "download_url", "device_type", "version"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key];
  }

  const { error } = await (supabase as any)
    .from("firmware_releases")
    .update(patch)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from("firmware_releases")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (data?.storage_path) {
    await (supabase as any).storage.from("firmware").remove([data.storage_path]);
  }

  const { error } = await (supabase as any)
    .from("firmware_releases")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Server error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
