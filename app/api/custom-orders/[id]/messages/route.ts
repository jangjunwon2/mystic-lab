import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// 고객 메시지 API — 로그인 회원이 본인 커스텀 주문에 메시지 발송

async function getAuthedOrder(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const { data: order } = await admin
    .from("custom_order_requests")
    .select("id, email, name")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.email !== user.email) return null;
  return order as { id: string; email: string; name: string };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getAuthedOrder(id);
  if (!order) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const { data: messages } = await admin
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
  const { id } = await params;
  const order = await getAuthedOrder(id);
  if (!order) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;
  const { data: msg, error } = await admin
    .from("custom_order_messages")
    .insert({ order_id: id, sender: "customer", message: message.trim() })
    .select("id, sender, message, created_at")
    .single();

  if (error) return NextResponse.json({ error: "저장 실패." }, { status: 500 });

  // 어드민에게 이메일 알림 (best-effort)
  const adminEmail = process.env.ADMIN_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (adminEmail && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Mystic Lab <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[Mystic Lab] 커스텀 주문 새 메시지 — ${order.name}`,
      html: `<p><b>${order.name}</b> (${order.email})이 커스텀 주문에 메시지를 남겼습니다.</p>
             <blockquote>${message.trim().replace(/\n/g, "<br>")}</blockquote>
             <p><a href="${siteUrl}/admin/custom-orders">어드민 바로가기</a></p>`,
    }).catch(() => {});
  }

  return NextResponse.json(msg);
}
