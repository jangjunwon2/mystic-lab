import { createAdminClient } from "@/lib/supabase/server";
import ReviewsAdminTable from "@/components/admin/ReviewsAdminTable";

export const metadata = { title: "리뷰 관리 — Admin" };

export default async function Admin리뷰 관리Page() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, is_approved, is_reported, created_at, user_id,
      products(slug, product_translations(name, language)),
      profiles(display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const pending = (reviews ?? []).filter((r: { is_approved: boolean }) => !r.is_approved).length;

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
