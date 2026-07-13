import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
    }

    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 팁 목록과 작성자의 display_name 조회
    const { data: tips, error } = await supabase
      .from("tutorial_tips" as any)
      .select("id, timestamp_seconds, content, created_at, likes_count, user_id, video_id, profiles(display_name)")
      .eq("product_id", productId)
      .order("timestamp_seconds", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tips);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product_id, timestamp_seconds, content, video_id } = await request.json();

    if (!product_id || timestamp_seconds == null || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: tip, error } = await supabase
      .from("tutorial_tips" as any)
      .insert({
        user_id: user.id,
        product_id,
        timestamp_seconds,
        content,
        video_id: video_id ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tip);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing tip id" }, { status: 400 });
    }

    // 현재 likes_count 조회 후 1 증가 업데이트 (낙관적 방식)
    const { data: currentTip, error: selectError } = await supabase
      .from("tutorial_tips" as any)
      .select("likes_count")
      .eq("id", id)
      .single();

    if (selectError || !currentTip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    const { data: updatedTip, error: updateError } = await supabase
      .from("tutorial_tips" as any)
      .update({ likes_count: (currentTip.likes_count || 0) + 1 })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedTip);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
