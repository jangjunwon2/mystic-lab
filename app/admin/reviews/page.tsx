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
      id, rating, comment, is_approved, created_at, user_id,
      products(slug, product_translations(name, language))
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  type RawReviewRow = {
    id: string;
    rating: number;
    comment: string | null;
    is_approved: boolean;
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
            리뷰 관리
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
            리뷰는 작성 즉시 게시됩니다. 부적절한 리뷰는 미노출 처리하거나 삭제하세요.
          </p>
        </div>
      </div>
      <ReviewsAdminTable reviews={reviews ?? []} />
    </div>
  );
}
