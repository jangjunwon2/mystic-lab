import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { encryptCode } from "@/lib/crypto/unlock-code";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function generateMemberCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[randomBytes(1)[0] % chars.length]).join("");
  return `MC-${seg()}-${seg()}`;
}

// POST: 특정 회원에게 신규 앱 권한(인증코드) 발급
export async function POST(request: Request, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const { product_id } = (body ?? {}) as { product_id?: string };

  if (!product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const plainCode = generateMemberCode();
  const codeHash = createHash("sha256").update(plainCode).digest("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data, error } = await supabase
    .from("product_unlock_codes")
    .insert({
      product_id,
      code_hash: codeHash,
      code_plain: encryptCode(plainCode),
      user_id: userId,
      max_activations: 5,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }

  return NextResponse.json({
    id: (data as { id: string }).id,
    product_id,
    created_at: (data as { created_at: string }).created_at,
    code_plain: plainCode,
    is_activated: false,
    last_activated_at: null,
    activation_count: 0,
    max_activations: 5,
    is_locked: false,
  }, { status: 201 });
}
