import { createAdminClient } from "@/lib/supabase/server";
import UsersAdminTable, { type AdminUser } from "@/components/admin/UsersAdminTable";

export const metadata = { title: "회원 관리 — Admin" };

export default async function AdminUsersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const [profilesRes, authRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, status, suspension_reason, created_at")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authRes.data?.users ?? []).map((u: any) => [u.id as string, u.email as string])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: AdminUser[] = (profilesRes.data ?? []).map((p: any) => ({
    ...p,
    status: p.status ?? "active",
    email: emailMap.get(p.id) ?? null,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          회원 관리
        </h1>
        <span className="text-sm" style={{ color: "#9CA3AF" }}>
          {users.length} total members
        </span>
      </div>
      <UsersAdminTable users={users} />
    </div>
  );
}
