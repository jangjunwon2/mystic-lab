import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function listAllAuthUsers(): Promise<{ id: string; email?: string }[]> {
    const all: { id: string; email?: string }[] = [];
    let page = 1;
    while (true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).auth.admin.listUsers({ page, perPage: 1000 });
      const users = (data?.users ?? []) as { id: string; email?: string }[];
      all.push(...users);
      if (users.length < 1000) break;
      page++;
    }
    return all;
  }

  const [profilesRes, allAuthUsers] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, status, suspension_reason, created_at")
      .order("created_at", { ascending: false }),
    listAllAuthUsers(),
  ]);

  const emailMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allAuthUsers.map((u: any) => [u.id, u.email as string])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = (profilesRes.data ?? []).map((p: any) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));

  return NextResponse.json(users);
}
