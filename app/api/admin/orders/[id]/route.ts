import { requireAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendShippingNotification, sendReviewRequestEmail } from "@/lib/resend";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json() as {
    status?: string;
    tracking_number?: string;
    tracking_carrier?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  // Status update
  if (body.status !== undefined) {
    const valid = ["pending", "paid", "shipped", "completed", "refunded"];
    if (!valid.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const nowIso = new Date().toISOString();
    const statusUpdate: Record<string, string> = { status: body.status };
    if (body.status === "shipped") statusUpdate.shipped_at = nowIso;
    if (body.status === "completed") statusUpdate.completed_at = nowIso;

    // 환불 전환 시 재고·마일리지 복원 (상태 변경 전 멱등 처리)
    if (body.status === "refunded") {
      const { reverseOrderEffects } = await import("@/lib/payments/refund-order");
      await reverseOrderEffects(supabase, id);
    }

    const { error } = await supabase.from("orders").update(statusUpdate).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // completed 전환 시 리뷰 요청 이메일 자동 발송
    if (body.status === "completed") {
      const { data: orderDetail } = await supabase
        .from("orders")
        .select("customer_email, order_items(quantity, products(slug, product_translations(name, language)))")
        .eq("id", id)
        .single();

      if (orderDetail?.customer_email) {
        const items = ((orderDetail.order_items ?? []) as {
          products: { slug: string; product_translations: { name: string; language: string }[] } | null;
        }[])
          .filter((i) => i.products)
          .map((i) => ({
            slug: i.products!.slug,
            name: i.products!.product_translations.find((t) => t.language === "en")?.name
              ?? i.products!.product_translations[0]?.name
              ?? i.products!.slug,
          }));

        sendReviewRequestEmail({
          to: orderDetail.customer_email,
          orderId: id,
          items,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app",
        }).catch((err) => console.error("[completed] review email failed:", err));
      }
    }
  }

  // Tracking update
  if (body.tracking_number !== undefined) {
    const { error } = await supabase
      .from("orders")
      .update({
        tracking_number: body.tracking_number || null,
        tracking_carrier: body.tracking_carrier || null,
        ...(body.tracking_number ? { status: "shipped", shipped_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send shipping email if tracking number added
    if (body.tracking_number) {
      const { data: order } = await supabase
        .from("orders")
        .select("customer_email")
        .eq("id", id)
        .single();
      if (order?.customer_email) {
        await sendShippingNotification({
          to: order.customer_email,
          orderId: id,
          trackingNumber: body.tracking_number,
          carrier: body.tracking_carrier ?? null,
        }).catch(() => { /* non-critical */ });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
