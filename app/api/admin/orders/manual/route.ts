import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface ManualOrderItem {
  product_id: string;
  quantity: number;
  price_usd: number;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    user_id: string;
    customer_email: string;
    items: ManualOrderItem[];
    note?: string;
  };

  if (!body.user_id || !body.customer_email || !body.items?.length) {
    return NextResponse.json({ error: "user_id, customer_email, items required" }, { status: 400 });
  }
  for (const item of body.items) {
    if (!item.product_id || typeof item.product_id !== "string") {
      return NextResponse.json({ error: "Invalid product_id." }, { status: 400 });
    }
    if (!Number.isFinite(item.price_usd) || item.price_usd < 0) {
      return NextResponse.json({ error: "price_usd must be >= 0." }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return NextResponse.json({ error: "quantity must be a positive integer." }, { status: 400 });
    }
  }

  const total = body.items.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // 주문 생성
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: body.user_id,
      customer_email: body.customer_email,
      status: "paid",
      total_usd: total,
      shipping_address: body.note ? { note: body.note } : null,
    })
    .select("id")
    .single();

  if (orderErr) return NextResponse.json({ error: "Server error" }, { status: 500 });

  // 주문 아이템 생성
  const itemRows = body.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price_usd: i.price_usd,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) return NextResponse.json({ error: "Server error" }, { status: 500 });

  return NextResponse.json({ order_id: order.id });
}
