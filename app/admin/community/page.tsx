import { createAdminClient } from "@/lib/supabase/server";
import { getCommunityPostsForAdmin } from "@/lib/community-admin";
import CommunityAdminClient from "@/components/admin/CommunityAdminClient";

export const metadata = { title: "Community — Admin" };

export default async function AdminCommunityPage() {
  const admin = await createAdminClient();
  const posts = await getCommunityPostsForAdmin(admin);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>구매자 커뮤니티 관리</h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          전 상품의 개선 제안·연출 공유·공지 글과 댓글을 조회하고 삭제합니다.
        </p>
      </div>
      <CommunityAdminClient initialPosts={posts} />
    </div>
  );
}
