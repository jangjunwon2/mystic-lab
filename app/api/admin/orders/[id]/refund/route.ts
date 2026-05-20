import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
  return (data as { role?: string } | null)?.role === "admin" ? user : null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { reason } = await request.json().catch(() => ({ reason: "관리자 환불" }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, status, total_usd, stripe_payment_intent_id")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderRow = order as {
    id: string;
    status: string;
    total_usd: number;
    stripe_payment_intent_id: string | null;
  };

  if (orderRow.status === "refunded") {
    return NextResponse.json({ error: "Already refunded" }, { status: 400 });
  }

  const ref = orderRow.stripe_payment_intent_id ?? "";
  let gatewayMessage = "";

  if (ref.startsWith("toss_")) {
    const paymentKey = ref.slice(5);
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (secretKey) {
      const encoded = Buffer.from(`${secretKey}:`).toString("base64");
      const tossRes = await fetch(
        `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${encoded}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cancelReason: reason ?? "관리자 환불" }),
        }
      );
      if (!tossRes.ok) {
        const err = await tossRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: `Toss cancel failed: ${(err as Record<string,string>).message ?? "unknown"}` },
          { status: 400 }
        );
      }
      gatewayMessage = "Toss 환불 완료";
    }
  } else if (ref.startsWith("lemon_")) {
    const lsId = ref.slice(6);
    gatewayMessage = `Lemon Squeezy 주문 ID: ${lsId} — LS 대시보드에서 수동 환불 처리 필요`;
  } else {
    gatewayMessage = "수동 주문 — 별도 결제 게이트웨이 없음";
  }

  // Update order status to refunded
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: gatewayMessage });
}
