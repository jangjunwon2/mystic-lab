import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

interface MatchedUser { id: string; email: string; display_name: string }

// GET /api/admin/users/search?q=... — 이메일 또는 이름으로 회원 검색 (증정/권한부여용)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 과호출 방지 (어드민 전용이지만 키입력당 호출되므로 가드)
  if (!checkRateLimit(`users-search:${getClientIP(request)}`, 60, 60_000)) {
    return NextResponse.json({ users: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // PostgREST or-filter·LIKE 와일드카드에 위험한 문자 제거
  const safe = q.replace(/[%_,()*\\]/g, " ").trim();
  if (safe.length < 2) return NextResponse.json({ users: [] });
  const pattern = `%${safe}%`;

  // 빠른 경로: profiles(email, display_name) 단일 ILIKE 쿼리 (030 마이그레이션 필요)
  const { data: profMatches, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .or(`email.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(20);

  if (!error && Array.isArray(profMatches)) {
    const users: MatchedUser[] = profMatches.map((p: { id: string; display_name: string | null; email: string | null }) => ({
      id: p.id,
      email: p.email ?? "",
      display_name: p.display_name ?? "",
    }));
    return NextResponse.json({ users });
  }

  // 폴백: 030 미적용(email 컬럼 부재) 등 — 레거시 listUsers 방식
  const { data: listRes } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authUsers: { id: string; email: string }[] = (listRes?.users ?? [])
    .map((u: { id: string; email?: string }) => ({ id: u.id, email: u.email ?? "" }));

  const { data: profs } = await supabase.from("profiles").select("id, display_name");
  const nameMap = new Map<string, string>(
    ((profs ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name ?? ""])
  );

  const matched: MatchedUser[] = authUsers
    .map((u) => ({ id: u.id, email: u.email, display_name: nameMap.get(u.id) ?? "" }))
    .filter((u) => u.email.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q))
    .slice(0, 20);

  return NextResponse.json({ users: matched });
}
