import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("referral_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    code: string;
    referrer_name: string;
    referrer_email?: string;
    discount_percent: number;
  };

  if (!body.code?.trim() || !body.referrer_name?.trim()) {
    return NextResponse.json({ error: "Code and referrer name are required." }, { status: 400 });
  }

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("referral_codes")
    .insert({
      code: body.code.trim().toUpperCase(),
      referrer_name: body.referrer_name.trim(),
      referrer_email: body.referrer_email?.trim() || null,
      discount_percent: body.discount_percent ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
