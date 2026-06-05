import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, customer_email, status, total_usd, order_items(quantity, price_usd, products(slug, product_translations(name, language)))")
    .gte("created_at", new Date(from).toISOString())
    .lte("created_at", new Date(to + "T23:59:59").toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }

  const rows: string[] = [
    ["날짜", "주문ID", "이메일", "상태", "금액(USD)", "상품"].join(","),
  ];

  for (const order of (orders ?? [])) {
    const date = order.created_at.slice(0, 10);
    const id = order.id.slice(0, 8).toUpperCase();
    const email = `"${order.customer_email ?? ""}"`;
    const status = order.status;
    const total = order.total_usd.toFixed(2);

    const itemNames = (order.order_items ?? [])
      .map((item: { products: { product_translations: { name: string; language: string }[] } | null; quantity: number }) => {
        const name =
          item.products?.product_translations?.find((t: { language: string }) => t.language === "ko")?.name ??
          item.products?.product_translations?.find((t: { language: string }) => t.language === "en")?.name ??
          "Unknown";
        return `${name} x${item.quantity}`;
      })
      .join(" / ");

    rows.push([date, id, email, status, total, `"${itemNames}"`].join(","));
  }

  const csv = rows.join("\n");
  const filename = `mysticlab-orders-${from}-to-${to}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
