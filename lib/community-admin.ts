// 어드민 커뮤니티 관리 — 전 상품 글+댓글 조립(서버). API GET·어드민 페이지 공용.

export interface AdminCommunityComment { id: string; body: string; authorName: string; createdAt: string }
export interface AdminCommunityPost {
  id: string; productId: string; productName: string; type: string;
  title: string | null; body: string; isPinned: boolean; authorName: string; createdAt: string;
  comments: AdminCommunityComment[];
}

interface PostRow { id: string; product_id: string; author_id: string | null; type: string; title: string | null; body: string; is_pinned: boolean; created_at: string }
interface CommentRow { id: string; post_id: string; author_id: string | null; body: string; created_at: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCommunityPostsForAdmin(supabase: any): Promise<AdminCommunityPost[]> {
  const { data: postsData } = await supabase
    .from("product_posts")
    .select("id, product_id, author_id, type, title, body, is_pinned, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  const posts = (postsData ?? []) as PostRow[];
  if (posts.length === 0) return [];

  const productIds = [...new Set(posts.map((p) => p.product_id))];
  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))] as string[];

  const [prodsRes, commentsRes] = await Promise.all([
    supabase.from("products").select("id, slug, product_translations(name, language)").in("id", productIds),
    supabase.from("product_post_comments").select("id, post_id, author_id, body, created_at").in("post_id", postIds).order("created_at", { ascending: true }),
  ]);

  const comments = (commentsRes.data ?? []) as CommentRow[];
  const commentAuthorIds = comments.map((c) => c.author_id).filter(Boolean) as string[];
  const allAuthorIds = [...new Set([...authorIds, ...commentAuthorIds])];

  const { data: profs } = allAuthorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", allAuthorIds)
    : { data: [] };
  const nameMap = new Map<string, string>(((profs ?? []) as { id: string; display_name: string }[]).map((p) => [p.id, p.display_name]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodName = (p: any): string =>
    p?.product_translations?.find((t: { language: string }) => t.language === "ko")?.name ??
    p?.product_translations?.find((t: { language: string }) => t.language === "en")?.name ??
    p?.slug ?? "—";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productMap = new Map<string, string>(((prodsRes.data ?? []) as any[]).map((p) => [p.id, prodName(p)]));

  const commentsByPost = new Map<string, CommentRow[]>();
  for (const c of comments) {
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push(c);
    commentsByPost.set(c.post_id, arr);
  }

  return posts.map((p) => ({
    id: p.id,
    productId: p.product_id,
    productName: productMap.get(p.product_id) ?? "—",
    type: p.type,
    title: p.title,
    body: p.body,
    isPinned: p.is_pinned,
    authorName: p.author_id ? (nameMap.get(p.author_id) ?? "회원") : (p.type === "update" ? "Mystic Lab" : "—"),
    createdAt: p.created_at,
    comments: (commentsByPost.get(p.id) ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.author_id ? (nameMap.get(c.author_id) ?? "회원") : "—",
      createdAt: c.created_at,
    })),
  }));
}
