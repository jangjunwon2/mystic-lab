import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { sendShippingNotification } from "@/lib/resend";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
  return (profile as { role?: string } | null)?.role === "admin" ? user : null;
}

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
    const { error } = await supabase.from("orders").update({ status: body.status }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Tracking update
  if (body.tracking_number !== undefined) {
    const { error } = await supabase
      .from("orders")
      .update({
        tracking_number: body.tracking_number || null,
        tracking_carrier: body.tracking_carrier || null,
        ...(body.tracking_number ? { status: "shipped" } : {}),
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
