import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ wishlist: [] });

  const { data } = await (supabase as any)
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id);

  return NextResponse.json({ wishlist: (data ?? []).map((r: { product_id: string }) => r.product_id) });
}

export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(`wishlist-post:${getClientIP(req)}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  const { error } = await (supabase as any)
    .from("wishlists")
    .insert({ user_id: user.id, product_id });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Failed to update wishlist." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkRateLimit(`wishlist-delete:${getClientIP(req)}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  await (supabase as any)
    .from("wishlists")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", product_id);

  return NextResponse.json({ ok: true });
}
