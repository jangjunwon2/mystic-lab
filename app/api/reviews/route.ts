import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 스팸 방지 — IP당 분당 10회
  if (!(await checkRateLimit(`review:${getClientIP(request)}`, 10, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });

  const { product_id, rating, comment } = (await request.json()) as {
    product_id: string;
    rating: number;
    comment?: string;
  };

  if (!product_id || !rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating." }, { status: 400 });
  }

  if (comment && comment.length > 5000) {
    return NextResponse.json({ error: "Comment too long (max 5000 characters)." }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Verify purchase
  // 리뷰는 배송완료(completed) 주문에 대해서만 작성 가능
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderItem } = await (admin as any)
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", product_id)
    .eq("orders.user_id", user.id)
    .eq("orders.status", "completed")
    .limit(1)
    .maybeSingle();

  if (!orderItem) {
    return NextResponse.json(
      { error: "배송 완료된 주문에 대해서만 리뷰를 작성할 수 있습니다." },
      { status: 403 }
    );
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

  if (error) return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  return NextResponse.json({ ok: true, id: review.id });
}
