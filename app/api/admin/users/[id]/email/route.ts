import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendCustomOrderReply } from "@/lib/resend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { subject, message } = (await request.json()) as { subject: string; message: string };

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { data: targetUser } = await admin.auth.admin.getUserById(id);
  if (!targetUser?.user?.email) {
    return NextResponse.json({ error: "User not found or has no email." }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetProfile } = await (admin as any)
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .single();

  const name = (targetProfile as { display_name?: string | null } | null)?.display_name
    ?? targetUser.user.email.split("@")[0];

  await sendCustomOrderReply({
    to: targetUser.user.email,
    customerName: name,
    subject,
    message,
  });

  return NextResponse.json({ ok: true });
}
