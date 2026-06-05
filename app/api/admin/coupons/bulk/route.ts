import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { issueCoupon } from "@/lib/coupons";
import { sendCouponEmailsBatch } from "@/lib/resend";

// 일괄발급은 다수 insert + 이메일 배치 → 시간이 걸릴 수 있어 실행시간 상한을 늘린다.
export const maxDuration = 300;

const MAX_RECIPIENTS = 2000;
const PAID_STATUSES = ["paid", "shipped", "completed"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Target = "all" | "newsletter" | "buyers" | "wishlist_product" | "manual";
interface Recipient {
  email: string;
  userId: string | null;
}

// auth.users 전체를 페이지네이션으로 수집 → id→email 맵. (회원 증가에도 동작)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function listAllUsers(admin: any): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; page <= 50; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = (data?.users ?? []) as { id: string; email: string | null }[];
    for (const u of users) if (u.email) map.set(u.id, u.email);
    if (users.length < 1000) break;
  }
  return map;
}

// 직접입력 텍스트(줄바꿈/콤마/공백 구분) → 유효 이메일 배열.
function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_RE.test(e));
}

// 대상별 수신자 목록 해석. buyers/wishlist/all 은 회원, newsletter/manual 은 이메일만.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveRecipients(admin: any, target: Target, productId: string | undefined, emailsRaw: string | undefined): Promise<Recipient[]> {
  if (target === "manual") {
    return parseEmails(emailsRaw ?? "").map((email) => ({ email, userId: null }));
  }
  if (target === "newsletter") {
    const { data } = await admin.from("newsletter_subscribers").select("email").eq("is_active", true);
    return ((data ?? []) as { email: string }[]).map((r) => ({ email: r.email, userId: null }));
  }

  const idToEmail = await listAllUsers(admin); // id → email
  if (target === "all") {
    return [...idToEmail.entries()].map(([userId, email]) => ({ email, userId }));
  }

  let userIds: string[] = [];
  if (target === "buyers") {
    const { data } = await admin.from("orders").select("user_id").not("user_id", "is", null).in("status", PAID_STATUSES);
    userIds = [...new Set(((data ?? []) as { user_id: string }[]).map((o) => o.user_id))];
  } else {
    // wishlist_product
    const { data } = await admin.from("wishlists").select("user_id").eq("product_id", productId);
    userIds = [...new Set(((data ?? []) as { user_id: string }[]).map((w) => w.user_id))];
  }
  return userIds
    .map((id) => ({ email: idToEmail.get(id) ?? "", userId: id }))
    .filter((r) => r.email);
}

// POST — 이벤트 일괄발급. 대상별 개인 쿠폰(1인 1코드·1회용, source='bulk')을 발급한다.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    target?: Target;
    productId?: string;
    emails?: string;
    name?: string | null;
    type?: "percent" | "fixed";
    value?: number;
    minOrderUsd?: number;
    expiresMonths?: number | null;
    productIds?: string[];
    categories?: string[];
    sendEmail?: boolean;
  };

  const target = body.target;
  if (!target || !["all", "newsletter", "buyers", "wishlist_product", "manual"].includes(target)) {
    return NextResponse.json({ error: "대상을 선택해주세요." }, { status: 400 });
  }
  if (target === "wishlist_product" && !body.productId) {
    return NextResponse.json({ error: "위시리스트 대상 상품을 선택해주세요." }, { status: 400 });
  }

  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0 || (type === "percent" && value > 100)) {
    return NextResponse.json({ error: "할인 값이 올바르지 않습니다." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;

  const all = await resolveRecipients(supabase, target, body.productId, body.emails);

  // 중복가드 — 같은 이메일 1건만. 상한 초과분은 컷.
  const seen = new Set<string>();
  const deduped: Recipient[] = [];
  for (const r of all) {
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }
  const total = deduped.length;
  const capped = total > MAX_RECIPIENTS;
  const recipients = capped ? deduped.slice(0, MAX_RECIPIENTS) : deduped;

  if (recipients.length === 0) {
    return NextResponse.json({ error: "발급 대상이 없습니다." }, { status: 400 });
  }

  const name = body.name?.trim() || null;
  const minOrderUsd = body.minOrderUsd ?? 0;
  const expiresMonths = body.expiresMonths === undefined ? 6 : body.expiresMonths;
  const productIds = Array.isArray(body.productIds) ? body.productIds : [];
  const categories = Array.isArray(body.categories) ? body.categories : [];

  const emailItems: { to: string; code: string }[] = [];
  let issued = 0;
  for (const r of recipients) {
    const code = await issueCoupon(supabase, {
      userId: r.userId,
      email: r.email,
      type,
      value,
      source: "bulk",
      minOrderUsd,
      expiresMonths,
      productIds,
      categories,
      name,
    });
    if (code) {
      issued++;
      emailItems.push({ to: r.email, code });
    }
  }

  let emailed = 0;
  if (body.sendEmail && emailItems.length > 0) {
    const res = await sendCouponEmailsBatch(emailItems, type, value);
    emailed = res.sent;
  }

  return NextResponse.json({ ok: true, total, issued, emailed, capped });
}
