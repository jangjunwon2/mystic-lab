import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendCustomOrderNotification } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, description, budget_range, desired_deadline } = body;

    if (!name || !email || !description || !budget_range) {
      return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("custom_order_requests").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      description: description.trim(),
      budget_range,
      desired_deadline: desired_deadline || null,
    });

    if (error) {
      console.error("Custom order insert error:", error);
      return NextResponse.json({ error: "Failed to submit inquiry." }, { status: 500 });
    }

    await sendCustomOrderNotification({
      customerName: name.trim(),
      customerEmail: email.trim().toLowerCase(),
      description: description.trim(),
      budgetRange: budget_range,
      desiredDeadline: desired_deadline ?? null,
    }).catch((err) => console.error("[custom-order] Admin email failed:", err));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
