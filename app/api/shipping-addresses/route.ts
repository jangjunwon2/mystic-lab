import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to process address." }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, phone, line1, line2, city, postal, country, set_default } = body;

  if (!name?.trim() || !line1?.trim() || !country?.trim()) {
    return NextResponse.json({ error: "name, line1, country are required" }, { status: 400 });
  }

  // If setting as default, clear other defaults first
  if (set_default) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("shipping_addresses")
    .insert({
      user_id: user.id,
      name: name.trim(),
      phone: phone?.trim() || null,
      line1: line1.trim(),
      line2: line2?.trim() || null,
      city: city?.trim() || null,
      postal: postal?.trim() || null,
      country: country.trim().toUpperCase(),
      is_default: set_default ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to process address." }, { status: 500 });
  return NextResponse.json(data);
}
