import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — 로그인 회원의 서버 장바구니 항목 반환.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("cart_items")
    .select("product_id, option_id, quantity, slug, name, price_usd, option_name")
    .eq("user_id", user.id);

  return NextResponse.json(data ?? []);
}

// POST — localStorage 장바구니를 서버에 full-replace로 동기화.
// body: StoredCartItem[] — 현재 localStorage 전체 내용을 그대로 받는다.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const now = new Date().toISOString();

  // 기존 항목 전부 삭제 후 재삽입 (full-replace)
  await sb.from("cart_items").delete().eq("user_id", user.id);

  const rows = body
    .filter((i) => i && typeof i.id === "string" && Number(i.quantity) > 0)
    .map((i) => ({
      user_id: user.id,
      product_id: i.id,
      option_id: String(i.option_id ?? ""),
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
      slug: String(i.slug ?? ""),
      name: String(i.name ?? ""),
      price_usd: Number(i.price_usd) || 0,
      option_name: i.option_name ? String(i.option_name) : null,
      synced_at: now,
    }));

  if (rows.length > 0) {
    await sb.from("cart_items").insert(rows);
  }

  return NextResponse.json({ ok: true });
}
