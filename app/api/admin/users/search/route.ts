import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/admin/users/search?q=... — 이메일 또는 이름으로 회원 검색 (증정/권한부여용)
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // 1) auth 사용자 목록(이메일) — 최대 1000명
  const { data: listRes } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authUsers: { id: string; email: string }[] = (listRes?.users ?? [])
    .map((u: { id: string; email?: string }) => ({ id: u.id, email: u.email ?? "" }));

  // 2) profiles 이름 맵
  const { data: profs } = await supabase.from("profiles").select("id, display_name");
  const nameMap = new Map<string, string>(
    ((profs ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name ?? ""])
  );

  // 3) 이메일 또는 이름에 q 포함되는 회원 필터
  const matched = authUsers
    .map((u) => ({ id: u.id, email: u.email, display_name: nameMap.get(u.id) ?? "" }))
    .filter((u) => u.email.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q))
    .slice(0, 20);

  return NextResponse.json({ users: matched });
}
