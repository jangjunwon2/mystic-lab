import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { userOwnsProduct } from "@/lib/product-access";

const MAX_BODY = 5000;
const MAX_TITLE = 200;
const POST_TYPES = ["suggestion", "staging", "update"] as const;
type PostType = (typeof POST_TYPES)[number];

interface RouteContext {
  params: Promise<{ productId: string }>;
}

// 세션 사용자 + 권한 해석 (admin client 공유)
async function resolveAccess(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null as null, isAdmin: false, canAccess: false, admin: null as null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;
  const canAccess = isAdmin || (await userOwnsProduct(admin, user.id, productId));
  return { user, isAdmin, canAccess, admin };
}

// GET — 해당 상품 커뮤니티 글(개선/연출/공지) + 댓글. 구매자·어드민만.
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { productId } = await ctx.params;
  const { user, isAdmin, canAccess, admin } = await resolveAccess(productId);

  if (!user) return NextResponse.json({ loggedIn: false, canAccess: false }, { status: 200 });
  if (!canAccess) return NextResponse.json({ loggedIn: true, canAccess: false }, { status: 200 });

  const { data: posts } = await admin
    .from("product_posts")
    .select("id, author_id, type, title, body, is_pinned, created_at")
    .eq("product_id", productId)
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const postRows = (posts ?? []) as {
    id: string; author_id: string | null; type: string; title: string | null;
    body: string; is_pinned: boolean; created_at: string;
  }[];

  const postIds = postRows.map((p) => p.id);
  let commentRows: { id: string; post_id: string; author_id: string | null; body: string; created_at: string }[] = [];
  if (postIds.length > 0) {
    const { data: comments } = await admin
      .from("product_post_comments")
      .select("id, post_id, author_id, body, created_at")
      .in("post_id", postIds)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true });
    commentRows = (comments ?? []) as typeof commentRows;
  }

  // 작성자 표시명 배치 조회
  const authorIds = [...new Set([...postRows, ...commentRows].map((r) => r.author_id).filter(Boolean))] as string[];
  const nameMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profs } = await admin.from("profiles").select("id, display_name").in("id", authorIds);
    for (const p of (profs ?? []) as { id: string; display_name: string | null }[]) {
      nameMap.set(p.id, p.display_name ?? "Magician");
    }
  }

  const commentsByPost = new Map<string, unknown[]>();
  for (const c of commentRows) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({
      id: c.id,
      body: c.body,
      authorName: c.author_id ? nameMap.get(c.author_id) ?? "Magician" : "—",
      createdAt: c.created_at,
      mine: c.author_id === user.id,
    });
    commentsByPost.set(c.post_id, list);
  }

  const shaped = postRows.map((p) => ({
    id: p.id,
    type: p.type,
    title: p.title,
    body: p.body,
    isPinned: p.is_pinned,
    authorName: p.author_id ? nameMap.get(p.author_id) ?? "Magician" : (p.type === "update" ? "Mystic Lab" : "—"),
    createdAt: p.created_at,
    mine: p.author_id === user.id,
    comments: commentsByPost.get(p.id) ?? [],
  }));

  const grouped: Record<PostType, unknown[]> = { suggestion: [], staging: [], update: [] };
  for (const p of shaped) {
    if ((POST_TYPES as readonly string[]).includes(p.type)) grouped[p.type as PostType].push(p);
  }

  return NextResponse.json({ loggedIn: true, canAccess: true, canPost: true, isAdmin, posts: grouped });
}

// POST — 글 작성(kind:"post") 또는 댓글 작성(kind:"comment")
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { productId } = await ctx.params;
  const { user, isAdmin, canAccess, admin } = await resolveAccess(productId);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canAccess) return NextResponse.json({ error: "해당 상품 구매자만 이용할 수 있습니다." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const kind = body?.kind;

  if (kind === "post") {
    const type = body?.type as string;
    if (!(POST_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: "잘못된 글 유형입니다." }, { status: 400 });
    }
    // 공지(update)는 어드민만
    if (type === "update" && !isAdmin) {
      return NextResponse.json({ error: "공지는 관리자만 작성할 수 있습니다." }, { status: 403 });
    }
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, MAX_TITLE) : null;
    if (!text || text.length > MAX_BODY) {
      return NextResponse.json({ error: `내용은 1~${MAX_BODY}자여야 합니다.` }, { status: 400 });
    }
    const { data, error } = await admin
      .from("product_posts")
      .insert({
        product_id: productId,
        author_id: user.id,
        type,
        title: title || null,
        body: text,
        is_pinned: type === "update",
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "작성에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (kind === "comment") {
    const postId = body?.postId as string;
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!postId) return NextResponse.json({ error: "대상 글이 없습니다." }, { status: 400 });
    if (!text || text.length > MAX_BODY) {
      return NextResponse.json({ error: `내용은 1~${MAX_BODY}자여야 합니다.` }, { status: 400 });
    }
    // 글이 해당 상품 소속인지 확인 (다른 상품 글에 댓글 방지)
    const { data: post } = await admin
      .from("product_posts")
      .select("id")
      .eq("id", postId)
      .eq("product_id", productId)
      .maybeSingle();
    if (!post) return NextResponse.json({ error: "대상 글을 찾을 수 없습니다." }, { status: 404 });

    const { data, error } = await admin
      .from("product_post_comments")
      .insert({ post_id: postId, author_id: user.id, body: text })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "작성에 실패했습니다." }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}

// DELETE — 본인 글/댓글 또는 어드민 삭제. body { kind:"post"|"comment", id }
export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const { productId } = await ctx.params;
  const { user, isAdmin, admin } = await resolveAccess(productId);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const kind = body?.kind;
  const id = body?.id as string;
  if (!id || (kind !== "post" && kind !== "comment")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const table = kind === "post" ? "product_posts" : "product_post_comments";
  const { data: row } = await admin.from(table).select("id, author_id").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ error: "대상을 찾을 수 없습니다." }, { status: 404 });
  if (!isAdmin && row.author_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
