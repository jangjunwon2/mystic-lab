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
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  // 주문 조회 (이메일 알림용)
  const { data: order } = await supabase
    .from("custom_order_requests")
    .select("name, email")
    .eq("id", id)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

  const { data: msg, error } = await supabase
    .from("custom_order_messages")
    .insert({ order_id: id, sender: "admin", message: message.trim() })
    .select("id, sender, message, created_at")
    .single();

  if (error) return NextResponse.json({ error: "저장 실패." }, { status: 500 });

  // 고객에게 이메일 알림 (best-effort)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Mystic Lab <onboarding@resend.dev>",
      to: order.email,
      subject: "[Mystic Lab] 커스텀 주문에 새 메시지가 도착했습니다",
      html: `<p>안녕하세요 ${order.name}님,</p>
             <p>커스텀 주문에 관리자의 메시지가 도착했습니다.</p>
             <blockquote style="border-left:3px solid #7C3AED;padding-left:1em;color:#555;">
               ${message.trim().replace(/\n/g, "<br>")}
             </blockquote>
             <p><a href="${siteUrl}/ko/account" style="color:#7C3AED;">마이페이지에서 확인하기</a></p>`,
    }).catch(() => {});
  }

  return NextResponse.json(msg);
}
