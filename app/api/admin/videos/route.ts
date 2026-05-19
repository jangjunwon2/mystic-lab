import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
  return (profile as { role?: string } | null)?.role === "admin" ? user : null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id, cloudflare_stream_id, title } = await request.json();

  if (!product_id || !cloudflare_stream_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data: video, error } = await supabase
    .from("solution_videos")
    .insert({ product_id, cloudflare_stream_id, title: title ?? null })
    .select("id, cloudflare_stream_id, title, created_at, product_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video }, { status: 201 });
}
