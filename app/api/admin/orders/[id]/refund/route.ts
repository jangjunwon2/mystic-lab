import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendRefundConfirmation } from "@/lib/resend";
import { reverseOrderEffects } from "@/lib/payments/refund-order";

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
    .select("id, status, total_usd, customer_email, stripe_payment_intent_id")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderRow = order as {
    id: string;
    status: string;
    total_usd: number;
    customer_email: string | null;
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
    const isSyntheticId = lsId.startsWith("lemon-success-");
    const lsKey = process.env.LEMON_SQUEEZY_API_KEY;

    if (isSyntheticId) {
      // 웹훅 미수신으로 실제 LS 주문 ID가 없음 — LS 대시보드에서 수동 환불 필요
      gatewayMessage = "⚠️ LS 주문 ID 미확인 — LemonSqueezy 대시보드에서 수동 환불 후 진행하세요";
    } else if (lsKey) {
      // 주문 상태 확인 (테스트 모드 여부)
      const orderInfoRes = await fetch(`https://api.lemonsqueezy.com/v1/orders/${lsId}`, {
        headers: { Authorization: `Bearer ${lsKey}`, Accept: "application/vnd.api+json" },
      });
      const orderInfo = orderInfoRes.ok ? await orderInfoRes.json() : null;
      const isTestMode = orderInfo?.data?.attributes?.test_mode === true;

      if (isTestMode) {
        // 테스트 주문은 API 환불 불가 — DB만 업데이트
        gatewayMessage = "ℹ️ 테스트 주문 — DB 상태만 환불로 변경 (LS 테스트 주문은 API 환불 불가)";
      } else {
        const lsRes = await fetch(`https://api.lemonsqueezy.com/v1/orders/${lsId}/refund`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lsKey}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
          },
          body: JSON.stringify({ data: { type: "orders", id: lsId, attributes: {} } }),
        });
        if (!lsRes.ok) {
          const err = await lsRes.json().catch(() => ({})) as Record<string, unknown>;
          const detail = (err.errors as { detail?: string }[])?.[0]?.detail ?? "unknown";
          return NextResponse.json({ error: `LemonSqueezy 환불 실패: ${detail}` }, { status: 400 });
        }
        gatewayMessage = "LemonSqueezy 환불 완료";
      }
    } else {
      gatewayMessage = `LS 주문 ID: ${lsId} — API 키 미설정, 대시보드에서 수동 환불`;
    }
  } else {
    gatewayMessage = "수동 주문 — 별도 결제 게이트웨이 없음";
  }

  // 재고 복원 + 마일리지(적립 회수/사용 복원) — 멱등(중복 방지). 상태 변경 전에 수행
  await reverseOrderEffects(supabase, id);

  // Update order status to refunded
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // 환불 완료 이메일 자동 발송
  if (orderRow.status !== "refunded") {
    sendRefundConfirmation({
      to: orderRow.customer_email ?? "",
      orderId: id,
      totalUsd: orderRow.total_usd,
    }).catch((err) => console.error("[refund] email failed:", err));
  }

  return NextResponse.json({ ok: true, message: gatewayMessage });
}
