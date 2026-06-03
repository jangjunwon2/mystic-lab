import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });

  const { product_id, rating, comment } = (await request.json()) as {
    product_id: string;
    rating: number;
    comment?: string;
  };

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating." }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Verify purchase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderItem } = await (admin as any)
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", product_id)
    .eq("orders.user_id", user.id)
    .in("orders.status", ["paid", "shipped", "completed"])
    .limit(1)
    .maybeSingle();

  // Check manual grant too
  let hasAccess = !!orderItem;
  if (!hasAccess) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: grant } = await (admin as any)
      .from("manual_video_grants")
      .select("id")
      .eq("product_id", product_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    hasAccess = !!grant;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Purchase required to leave a review." }, { status: 403 });
  }

  // Check for existing review
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("reviews")
    .select("id")
    .eq("product_id", product_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review, error } = await (admin as any)
    .from("reviews")
    .insert({
      product_id,
      user_id: user.id,
      rating,
      comment: comment?.trim() || null,
      // 게시 후 관리(post-moderation): 작성 즉시 공개, 어드민이 사후에 미노출/삭제
      is_approved: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: review.id });
}
