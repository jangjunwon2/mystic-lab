import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendNewsletter } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, html, segment } = (await request.json()) as {
    subject: string;
    html: string;
    segment: "all" | "buyers";
  };

  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "Subject and HTML are required." }, { status: 400 });
  }

  const admin = await createAdminClient();

  let recipients: string[] = [];

  if (segment === "buyers") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders } = await (admin as any)
      .from("orders")
      .select("user_id")
      .not("user_id", "is", null);

    const uniqueUserIds: string[] = [
      ...new Set(
        ((orders as { user_id: string }[]) ?? []).map((o) => o.user_id)
      ),
    ];

    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    recipients = (authData?.users ?? [])
      .filter((u) => uniqueUserIds.includes(u.id) && u.email)
      .map((u) => u.email as string);
  } else {
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    recipients = (authData?.users ?? [])
      .filter((u) => u.email)
      .map((u) => u.email as string);
  }

  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No recipients found." });
  }

  const result = await sendNewsletter({ subject, html, recipients });
  return NextResponse.json(result);
}
