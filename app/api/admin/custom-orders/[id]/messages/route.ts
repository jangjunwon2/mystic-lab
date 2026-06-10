import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { Resend } from "resend";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { data: messages } = await supabase
    .from("custom_order_messages")
    .select("id, sender, message, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json(messages ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { message } = (body ?? {}) as { message?: string };
  if (!message?.trim()) return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  // 주문 조회 (이메일 알림 + 결제 링크용)
  const { data: order } = await supabase
    .from("custom_order_requests")
    .select("name, email, payment_token, payment_status, quoted_price_usd, quoted_price_krw")
    .eq("id", id)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

  const { data: msg, error } = await supabase
    .from("custom_order_messages")
    .insert({ order_id: id, sender: "admin", message: message.trim() })
    .select("id, sender, message, created_at")
    .single();

  if (error) {
    const detail = (error as { message?: string }).message ?? "";
    if (detail.includes("does not exist") || detail.includes("relation")) {
      return NextResponse.json({ error: "DB 테이블 미설정 (migration 051 실행 필요)" }, { status: 500 });
    }
    return NextResponse.json({ error: "메시지 저장에 실패했습니다." }, { status: 500 });
  }

  // 고객에게 이메일 알림 (best-effort)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const hasPendingPayment = order.payment_status === "unpaid" && order.payment_token;
  const payUrl = hasPendingPayment ? `${siteUrl}/ko/custom-order/pay/${order.payment_token}` : null;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const priceInfo = order.quoted_price_usd
      ? `$${order.quoted_price_usd}${order.quoted_price_krw ? ` / ₩${Number(order.quoted_price_krw).toLocaleString()}` : ""}`
      : null;

    const paySection = payUrl
      ? `<div style="margin:24px 0;text-align:center;">
           <p style="margin-bottom:8px;font-size:14px;color:#555;">
             ${priceInfo ? `결제 금액: <strong>${priceInfo}</strong>` : "결제 링크가 준비되었습니다."}
           </p>
           <a href="${payUrl}"
              style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;font-weight:bold;font-size:15px;border-radius:10px;text-decoration:none;">
             💳 결제하기
           </a>
         </div>`
      : `<p><a href="${siteUrl}/ko/account" style="color:#7C3AED;">마이페이지에서 확인하기</a></p>`;

    resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Mystic Lab <onboarding@resend.dev>",
      to: order.email,
      subject: hasPendingPayment
        ? "[Mystic Lab] 커스텀 주문 견적이 도착했습니다 — 결제를 진행해 주세요"
        : "[Mystic Lab] 커스텀 주문에 새 메시지가 도착했습니다",
      html: `<div style="font-family:sans-serif;max-width:540px;margin:auto;padding:24px;">
               <h2 style="color:#7C3AED;margin-bottom:4px;">Mystic Lab</h2>
               <p>안녕하세요 <strong>${order.name}</strong>님,</p>
               <p>커스텀 주문에 관리자의 메시지가 도착했습니다.</p>
               <blockquote style="border-left:3px solid #7C3AED;padding-left:1em;color:#555;background:#f9f6ff;border-radius:4px;padding:12px 12px 12px 16px;margin:16px 0;">
                 ${message.trim().replace(/\n/g, "<br>")}
               </blockquote>
               ${paySection}
             </div>`,
    }).catch(() => {});
  }

  return NextResponse.json(msg);
}
