import { createAdminClient } from "@/lib/supabase/server";
import ReviewsAdminTable from "@/components/admin/ReviewsAdminTable";

export const metadata = { title: "Reviews — Admin" };

export default async function AdminReviewsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // reviews.user_id → auth.users 참조라 profiles FK 임베드가 불가능(PostgREST 에러 시 전체 null).
  // profiles(display_name)는 user_id로 별도 배치 조회 후 병합한다.
  const { data: reviewRows } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, is_approved, is_reported, created_at, user_id,
      products(slug, product_translations(name, language))
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  type RawReviewRow = {
    id: string;
    rating: number;
    comment: string | null;
    is_approved: boolean;
    is_reported: boolean;
    created_at: string;
    user_id: string;
    products: { slug: string; product_translations: { name: string; language: string }[] } | null;
  };
  const rows = (reviewRows ?? []) as RawReviewRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profMap = new Map<string, { display_name: string | null }>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const p of (profs ?? []) as { id: string; display_name: string | null }[]) {
      profMap.set(p.id, { display_name: p.display_name });
    }
  }

  const reviews = rows.map((r) => ({
    ...r,
    profiles: profMap.get(r.user_id) ?? null,
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
              {pending}건 대기
            </span>
          )}
        </h1>
      </div>
      <ReviewsAdminTable reviews={reviews ?? []} />
    </div>
  );
}
