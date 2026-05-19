import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
  return (profile as { role?: string } | null)?.role === "admin" ? user : null;
}

function generatePlainCode(): string {
  // Format: XXXX-XXXX-XXXX (alphanumeric uppercase, easy to type)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomChar = () => chars[randomBytes(1)[0] % chars.length];
  const segment = () => Array.from({ length: 4 }, randomChar).join("");
  return `${segment()}-${segment()}-${segment()}`;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id } = await request.json();
  if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  const plainCode = generatePlainCode();
  const codeHash = createHash("sha256").update(plainCode).digest("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data, error } = await supabase
    .from("product_unlock_codes")
    .insert({ product_id, code_hash: codeHash })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the plain code ONCE — never stored
  return NextResponse.json({ id: (data as { id: string }).id, code: plainCode }, { status: 201 });
}
