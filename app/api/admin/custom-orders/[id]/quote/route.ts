import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendCustomOrderQuoteEmail } from "@/lib/resend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const quotedPriceUsd = Number(body.quoted_price_usd);
  const quotedPriceKrw = body.quoted_price_krw ? Number(body.quoted_price_krw) : null;

  if (!quotedPriceUsd || quotedPriceUsd <= 0) {
    return NextResponse.json({ error: "금액을 입력해주세요." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const token = crypto.randomUUID();

  const { data: order, error } = await supabase
    .from("custom_order_requests")
    .update({
      quoted_price_usd: quotedPriceUsd,
      quoted_price_krw: quotedPriceKrw,
      payment_token: token,
      payment_status: "unpaid",
      status: "quoted",
    })
    .eq("id", id)
    .select("id, name, email")
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "저장 실패." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const paymentLink = `${siteUrl}/en/custom-order/pay/${token}`;

  await sendCustomOrderQuoteEmail({
    to: order.email,
    customerName: order.name,
    quotedPriceUsd,
    quotedPriceKrw,
    paymentLink,
  }).catch(() => {});

  return NextResponse.json({ ok: true, token, paymentLink });
}
