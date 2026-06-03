import { createAdminClient } from "@/lib/supabase/server";
import UsersAdminTable, { type AdminUser } from "@/components/admin/UsersAdminTable";

export const metadata = { title: "Users — Admin" };

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authUsers: any[] = authRes.data?.users ?? [];

  const emailMap = new Map<string, string>(
    authUsers.map((u) => [u.id as string, u.email as string])
  );

  // auth metadata에서 이름 폴백 (account 페이지와 동일한 우선순위)
  const metaNameMap = new Map<string, string>(
    authUsers
      .filter((u) => u.user_metadata?.full_name || u.user_metadata?.name)
      .map((u) => [u.id as string, (u.user_metadata?.full_name ?? u.user_metadata?.name) as string])
  );

  const phoneMap = new Map<string, string>(
    authUsers
      .filter((u) => u.user_metadata?.default_address?.phone)
      .map((u) => [u.id as string, u.user_metadata.default_address.phone as string])
  );

  const addressMap = new Map<string, string>(
    authUsers
      .filter((u) => u.user_metadata?.default_address?.line1)
      .map((u) => {
        const a = u.user_metadata.default_address;
        const parts = [a.line1, a.line2, a.city, a.postal, a.country].filter(Boolean).join(", ");
        return [u.id as string, parts];
      })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: AdminUser[] = (profilesRes.data ?? []).map((p: any) => ({
    ...p,
    status: p.status ?? "active",
    email: emailMap.get(p.id) ?? null,
    display_name: p.display_name || metaNameMap.get(p.id) || null,
    phone: phoneMap.get(p.id) ?? null,
    default_address: addressMap.get(p.id) ?? null,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          회원 관리
        </h1>
        <span className="text-sm" style={{ color: "#9CA3AF" }}>
          전체 {users.length}명
        </span>
      </div>
      <UsersAdminTable users={users} />
    </div>
  );
}
