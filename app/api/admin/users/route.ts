import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [profilesRes, authRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, status, suspension_reason, created_at")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authRes.data?.users ?? []).map((u: any) => [u.id, u.email as string])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (profilesRes.data ?? []).map((p: any) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));

  return NextResponse.json(users);
}
