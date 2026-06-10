import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendCustomOrderReply } from "@/lib/resend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 어드민 판별 통일 — 이메일 기반 requireAdmin (profiles.role 금지)
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rawBody = await request.json().catch(() => null);
  const { subject, message } = (rawBody ?? {}) as { subject?: string; message?: string };

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (admin as any)
    .from("custom_order_requests")
    .select("name, email")
    .eq("id", id)
    .single();

  if (!req) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  await sendCustomOrderReply({
    to: (req as { name: string; email: string }).email,
    customerName: (req as { name: string; email: string }).name,
    subject,
    message,
  });

  // 고객 마이페이지에도 표시될 수 있도록 마지막 답변 내용을 DB에 저장
  await (admin as any)
    .from("custom_order_requests")
    .update({ admin_message: message })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
