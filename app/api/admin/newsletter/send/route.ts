import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendNewsletter } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawBody = await request.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { subject, html, segment, product_id } = rawBody as {
    subject: string;
    html: string;
    segment: "all" | "buyers" | "product_buyers" | "wishlist_product";
    product_id?: string;
  };

  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "Subject and HTML are required." }, { status: 400 });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "Subject must be 200 characters or less." }, { status: 400 });
  }
  if (Buffer.byteLength(html, "utf8") > 100 * 1024) {
    return NextResponse.json({ error: "HTML must be 100KB or less." }, { status: 400 });
  }
  if ((segment === "product_buyers" || segment === "wishlist_product") && !product_id) {
    return NextResponse.json({ error: "product_id is required for this segment." }, { status: 400 });
  }

  const admin = await createAdminClient();

  let recipients: string[] = [];

  if (segment === "wishlist_product") {
    // 특정 상품을 위시리스트에 담은 유저
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wishlistRows } = await (admin as any)
      .from("wishlists")
      .select("user_id")
      .eq("product_id", product_id);

    const uniqueUserIds: string[] = [
      ...new Set(
        ((wishlistRows as { user_id: string }[]) ?? []).map((r) => r.user_id)
      ),
    ];

    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    recipients = (authData?.users ?? [])
      .filter((u) => uniqueUserIds.includes(u.id) && u.email)
      .map((u) => u.email as string);
  } else if (segment === "product_buyers") {
    // 특정 상품 구매자: order_items에서 product_id로 필터
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (admin as any)
      .from("order_items")
      .select("orders(user_id, status)")
      .eq("product_id", product_id);

    const uniqueUserIds: string[] = [
      ...new Set(
        ((items as { orders: { user_id: string; status: string } | null }[]) ?? [])
          .map((i) => i.orders)
          .filter((o): o is { user_id: string; status: string } =>
            o !== null &&
            o.user_id !== null &&
            ["paid", "shipped", "completed"].includes(o.status)
          )
          .map((o) => o.user_id)
      ),
    ];

    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    recipients = (authData?.users ?? [])
      .filter((u) => uniqueUserIds.includes(u.id) && u.email)
      .map((u) => u.email as string);
  } else if (segment === "buyers") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders } = await (admin as any)
      .from("orders")
      .select("user_id")
      .not("user_id", "is", null)
      .in("status", ["paid", "shipped", "completed"]);

    const uniqueUserIds: string[] = [
      ...new Set(
        ((orders as { user_id: string }[]) ?? []).map((o) => o.user_id)
      ),
    ];

    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
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
