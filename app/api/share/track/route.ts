import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const VALID_CHANNELS = ["native", "facebook", "x", "whatsapp", "telegram", "line", "copy"];

// POST /api/share/track { product_id, channel } — 공유 버튼 클릭 트래킹 (공개)
export async function POST(request: Request) {
  try {
    const { product_id, channel } = (await request.json()) as {
      product_id?: string;
      channel?: string;
    };

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    await supabase.from("share_events").insert({
      product_id: product_id ?? null,
      channel,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 트래킹 실패는 조용히 무시 (사용자 경험 영향 없음)
    return NextResponse.json({ ok: false });
  }
}
