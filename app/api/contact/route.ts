import { NextRequest, NextResponse } from "next/server";
import { sendContactInquiry } from "@/lib/resend";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  if (!(await checkRateLimit(`contact:${ip}`, 5, 3_600_000))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { name, email, type, message, locale } = (await request.json()) as {
      name: string;
      email: string;
      type: string;
      message: string;
      locale?: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Required fields missing." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    await sendContactInquiry({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      type: type ?? "general",
      message: message.trim(),
      locale: locale ?? "en",
    }).catch((err: unknown) => console.error("[contact] Email failed:", err));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
