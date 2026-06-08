import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!productId || !email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("restock_alerts")
    .upsert(
      { product_id: productId, email, user_id: user?.id ?? null },
      { onConflict: "product_id,email", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[restock-alert] upsert error:", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!productId || !email) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("restock_alerts")
    .delete()
    .eq("product_id", productId)
    .eq("email", email);

  return NextResponse.json({ ok: true });
}
