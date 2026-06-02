import { createAdminClient } from "@/lib/supabase/server";
import ReviewsAdminTable from "@/components/admin/ReviewsAdminTable";

export const metadata = { title: "리뷰 관리 — Admin" };

export default async function AdminReviewsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // reviews.user_id는 auth.users(id)를 참조하므로 profiles를 직접 조인할 수 없다.
  // → 리뷰를 먼저 조회한 뒤 profiles는 별도로 가져와 병합한다.
  const { data: rawReviews } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, is_approved, is_reported, created_at, user_id,
      products(slug, product_translations(name, language))
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (rawReviews ?? []) as any[];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap: Record<string, { display_name: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (profs ?? []) as any[]) {
      profileMap[p.id] = { display_name: p.display_name ?? null };
    }
  }

  const reviews = rows.map((r) => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
  }));

  const pending = reviews.filter((r: { is_approved: boolean }) => !r.is_approved).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          리뷰 관리
          {pending > 0 && (
            <span
              className="ml-3 px-2 py-0.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
            >
              {pending} pending
            </span>
          )}
        </h1>
      </div>
      <ReviewsAdminTable reviews={reviews ?? []} />
    </div>
  );
}
