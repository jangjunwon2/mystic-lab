import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

interface BundleItemInput {
  product_id: string;
  quantity: number;
}

// POST { name, discount_percent, items:[{product_id, quantity}] } — 세트 생성
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    name?: string;
    discount_percent?: number;
    items?: BundleItemInput[];
  };

  const name = body.name?.trim();
  const discount = Math.trunc(Number(body.discount_percent));
  const items = (body.items ?? []).filter((i) => i.product_id && i.quantity >= 1);

  if (!name) return NextResponse.json({ error: "세트 이름을 입력하세요." }, { status: 400 });
  if (!Number.isFinite(discount) || discount < 0 || discount > 90) {
    return NextResponse.json({ error: "할인율은 0~90% 사이여야 합니다." }, { status: 400 });
  }
  if (items.length < 2) {
    return NextResponse.json({ error: "세트는 2개 이상의 상품으로 구성해야 합니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  const { data: bundle, error } = await supabase
    .from("bundles")
    .insert({ name, discount_percent: discount })
    .select("id")
    .single();
  if (error || !bundle) return NextResponse.json({ error: "세트 생성에 실패했습니다." }, { status: 500 });

  const { error: itemsErr } = await supabase.from("bundle_items").insert(
    items.map((i) => ({ bundle_id: bundle.id, product_id: i.product_id, quantity: Math.trunc(i.quantity) }))
  );
  if (itemsErr) {
    await supabase.from("bundles").delete().eq("id", bundle.id);
    return NextResponse.json({ error: "세트 구성 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id: bundle.id }, { status: 201 });
}
