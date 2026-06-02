import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to report a review." }, { status: 401 });

  const { id: reviewId } = await params;
  const { reason } = (await request.json()) as { reason: string };

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason is required." }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Insert report
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (admin as any)
    .from("review_reports")
    .insert({ review_id: reviewId, reported_by: user.id, reason: reason.trim() });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Mark review as reported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("reviews")
    .update({ is_reported: true })
    .eq("id", reviewId);

  return NextResponse.json({ ok: true });
}
