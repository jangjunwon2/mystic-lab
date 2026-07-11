# Shopping Feature Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 shopping features: enhanced search (description included), recently viewed products, related products section, and restock alert subscriptions.

**Architecture:** Search is a trivial server-side filter extension. Recently viewed uses localStorage with no DB (client-only). Related products is a server-side fetch added to the product detail page. Restock alerts require a new DB table, REST API, email via Resend, and a cron job. All UI follows the existing dark purple design system.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS), Resend email, Tailwind v4 CSS tokens, next-intl (7 locales)

**Note:** Order confirmation emails (`sendOrderConfirmation`) are already wired in all three payment handlers — skip that item.

---

## File Map

| Action | File |
|--------|------|
| Modify | `app/[locale]/products/page.tsx` — extend search filter |
| Modify | `components/TrackProductView.tsx` — also save to localStorage |
| Create | `components/products/RecentlyViewed.tsx` — client component |
| Create | `components/products/RelatedProducts.tsx` — server component |
| Modify | `app/[locale]/products/[slug]/page.tsx` — fetch related + render both |
| Create | `supabase/migrations/053_restock_alerts.sql` — new table |
| Create | `app/api/restock-alert/route.ts` — POST (subscribe) + DELETE (unsubscribe) |
| Create | `app/api/cron/restock-notify/route.ts` — cron job sends emails |
| Create | `components/products/RestockAlert.tsx` — UI button (client) |
| Modify | `lib/resend/index.ts` — add `sendRestockNotification` |
| Modify | `messages/en.json` + 6 other locales — add translation keys |
| Modify | `app/[locale]/products/[slug]/page.tsx` — wire RestockAlert + pass restock state |

---

## Task 1: 검색 강화 — Description 포함

**Files:**
- Modify: `app/[locale]/products/page.tsx:79`

- [ ] **Step 1: 검색 필터 수정**

In `app/[locale]/products/page.tsx`, find line 79:
```ts
    .filter((p) => !searchLower || p.name.toLowerCase().includes(searchLower));
```
Replace with:
```ts
    .filter((p) =>
      !searchLower ||
      p.name.toLowerCase().includes(searchLower) ||
      (p.short_description ?? "").toLowerCase().includes(searchLower)
    );
```

- [ ] **Step 2: 로컬 테스트**

```
npm run dev
```
상품 목록 → 검색창에 상품 설명에만 있는 단어 입력 → 결과에 나타나는지 확인.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/products/page.tsx
git commit -m "feat: extend product search to include short_description"
```

---

## Task 2: 최근 본 상품 — localStorage 기반

**Files:**
- Modify: `components/TrackProductView.tsx`
- Create: `components/products/RecentlyViewed.tsx`
- Modify: `app/[locale]/products/[slug]/page.tsx`

### Step 1: TrackProductView에 localStorage 저장 추가

`components/TrackProductView.tsx`의 기존 내용을 아래로 교체:

```tsx
"use client";

import { useEffect } from "react";

interface TrackProductViewProps {
  productId: string;
  locale: string;
  productSlug: string;
  productName: string;
  thumbnailUrl: string | null;
  priceUsd: number;
}

const RECENTLY_VIEWED_KEY = "ml_recently_viewed";
const MAX_ITEMS = 8;

export default function TrackProductView({
  productId,
  locale,
  productSlug,
  productName,
  thumbnailUrl,
  priceUsd,
}: TrackProductViewProps) {
  useEffect(() => {
    try {
      // 조회수 추적 (기존)
      const key = `ml_pv_${productId}_${new Date().toISOString().slice(0, 10)}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        fetch("/api/track/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, locale }),
          keepalive: true,
        }).catch(() => {});
      }

      // 최근 본 상품 localStorage 저장
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const existing: { id: string; slug: string; name: string; thumbnail: string | null; price: number }[] =
        raw ? JSON.parse(raw) : [];
      const filtered = existing.filter((p) => p.id !== productId);
      const updated = [
        { id: productId, slug: productSlug, name: productName, thumbnail: thumbnailUrl, price: priceUsd },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch {
      /* SSR / private browsing guard */
    }
  }, [productId, locale, productSlug, productName, thumbnailUrl, priceUsd]);

  return null;
}
```

### Step 2: RecentlyViewed 컴포넌트 생성

`components/products/RecentlyViewed.tsx` 신규 생성:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface RecentItem {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  price: number;
}

const RECENTLY_VIEWED_KEY = "ml_recently_viewed";

export default function RecentlyViewed({ locale, currentProductId }: { locale: string; currentProductId: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!raw) return;
      const all: RecentItem[] = JSON.parse(raw);
      setItems(all.filter((p) => p.id !== currentProductId).slice(0, 6));
    } catch {
      /* ignore */
    }
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2
        className="text-xl font-bold text-[#F0E6FF] mb-6"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${locale}/products/${item.slug}`}
            className="group block bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl overflow-hidden hover:border-[#7C3AED] transition-colors"
          >
            <div className="aspect-square bg-[#13131F] relative">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#2D2D4E] text-3xl">✦</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[#F0E6FF] text-xs font-medium truncate group-hover:text-[#A855F7] transition-colors">
                {item.name}
              </p>
              <p className="text-[#9CA3AF] text-xs mt-0.5">${item.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### Step 3: product page에서 TrackProductView props 추가 + RecentlyViewed 렌더

`app/[locale]/products/[slug]/page.tsx`에서:

1. 기존 `<TrackProductView productId={product.id} locale={locale} />` 를 아래로 교체:
```tsx
<TrackProductView
  productId={product.id}
  locale={locale}
  productSlug={product.slug}
  productName={translation.name}
  thumbnailUrl={product.thumbnail_url}
  priceUsd={product.price_usd}
/>
```

2. `</>`를 닫기 전, `<ProductDetail ... />` 다음에 추가:
```tsx
<RecentlyViewed locale={locale} currentProductId={product.id} />
```

3. 파일 상단 import에 추가:
```tsx
import RecentlyViewed from "@/components/products/RecentlyViewed";
```

- [ ] **Step 4: 로컬 테스트**

```
npm run dev
```
여러 상품 페이지 방문 → 상품 상세 하단에 "Recently Viewed" 섹션이 나타나는지 확인.

- [ ] **Step 5: Commit**

```bash
git add components/TrackProductView.tsx components/products/RecentlyViewed.tsx "app/[locale]/products/[slug]/page.tsx"
git commit -m "feat: add recently viewed products (localStorage)"
```

---

## Task 3: 관련 상품 추천

**Files:**
- Create: `components/products/RelatedProducts.tsx`
- Modify: `app/[locale]/products/[slug]/page.tsx`

### Step 1: RelatedProducts 서버 컴포넌트 생성

`components/products/RelatedProducts.tsx` 신규 생성:

```tsx
import Link from "next/link";
import Image from "next/image";

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  price: number;
}

export default function RelatedProducts({
  products,
  locale,
}: {
  products: RelatedProduct[];
  locale: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#2D2D4E]">
      <h2
        className="text-xl font-bold text-[#F0E6FF] mb-6"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        You May Also Like
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/${locale}/products/${p.slug}`}
            className="group block bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl overflow-hidden hover:border-[#7C3AED] transition-colors"
          >
            <div className="aspect-square bg-[#13131F] relative">
              {p.thumbnail ? (
                <Image
                  src={p.thumbnail}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#2D2D4E] text-3xl">✦</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-[#F0E6FF] text-sm font-medium truncate group-hover:text-[#A855F7] transition-colors">
                {p.name}
              </p>
              <p className="text-[#9CA3AF] text-sm mt-1">${p.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### Step 2: product page에서 관련 상품 fetch + 렌더

`app/[locale]/products/[slug]/page.tsx`에서:

1. 기존 `let` 선언들 아래에 추가:
```tsx
let relatedProducts: { id: string; slug: string; name: string; thumbnail: string | null; price: number }[] = [];
```

2. `product`를 성공적으로 fetch한 뒤, `reviews` 조회 블록 직후에 아래 쿼리 추가:
```tsx
// 관련 상품 — 같은 카테고리, 자기 자신 제외, 최대 4개
const { data: relatedData } = await supabase
  .from("products")
  .select("id, slug, thumbnail_url, price_usd, product_translations(name, language)")
  .eq("is_active", true)
  .eq("category", product.category)
  .neq("id", product.id)
  .order("display_order", { ascending: true })
  .limit(4);

relatedProducts = ((relatedData ?? []) as {
  id: string; slug: string; thumbnail_url: string | null; price_usd: number;
  product_translations: { name: string; language: string }[];
}[]).map((p) => ({
  id: p.id,
  slug: p.slug,
  thumbnail: p.thumbnail_url,
  price: p.price_usd,
  name:
    p.product_translations?.find((t) => t.language === locale)?.name ??
    p.product_translations?.find((t) => t.language === "en")?.name ??
    p.slug,
}));
```

3. 파일 상단 import에 추가:
```tsx
import RelatedProducts from "@/components/products/RelatedProducts";
```

4. `</>`를 닫기 전, `<RecentlyViewed .../>` 앞에 추가:
```tsx
<RelatedProducts products={relatedProducts} locale={locale} />
```

- [ ] **Step 3: 로컬 테스트**

```
npm run dev
```
같은 카테고리 상품이 2개 이상 있는 상품 페이지 → "You May Also Like" 섹션 확인.
상품이 1개뿐인 카테고리 → 섹션이 렌더되지 않는지 확인.

- [ ] **Step 4: Commit**

```bash
git add components/products/RelatedProducts.tsx "app/[locale]/products/[slug]/page.tsx"
git commit -m "feat: add related products section on product detail"
```

---

## Task 4: 재입고 알림

**Files:**
- Create: `supabase/migrations/053_restock_alerts.sql`
- Create: `app/api/restock-alert/route.ts`
- Create: `app/api/cron/restock-notify/route.ts`
- Create: `components/products/RestockAlert.tsx`
- Modify: `lib/resend/index.ts`
- Modify: `messages/en.json` (+ ko, ja, zh-CN, es, fr, de)
- Modify: `app/[locale]/products/[slug]/page.tsx`

### Step 1: DB 마이그레이션 생성

`supabase/migrations/053_restock_alerts.sql` 신규 생성:

```sql
-- 재입고 알림 구독 테이블
CREATE TABLE IF NOT EXISTS restock_alerts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (product_id, email)
);

-- RLS
ALTER TABLE restock_alerts ENABLE ROW LEVEL SECURITY;

-- anon/authenticated: 자신의 이메일로 구독한 행만 조회/삭제
CREATE POLICY "restock_alerts_own" ON restock_alerts
  USING (email = current_setting('request.jwt.claims', true)::jsonb->>'email'
    OR user_id = auth.uid());

-- 삽입은 anon 포함 누구나 가능 (이메일 입력 방식 지원)
CREATE POLICY "restock_alerts_insert" ON restock_alerts
  FOR INSERT WITH CHECK (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS restock_alerts_product_id_idx ON restock_alerts(product_id);
CREATE INDEX IF NOT EXISTS restock_alerts_notified_at_idx ON restock_alerts(notified_at) WHERE notified_at IS NULL;
```

**Supabase SQL 에디터에서 이 마이그레이션을 직접 실행하거나 Supabase CLI로 적용한다.**

### Step 2: 재입고 알림 이메일 함수 추가

`lib/resend/index.ts` 파일 끝에 추가:

```ts
export async function sendRestockNotification({
  to,
  productName,
  productSlug,
  locale = "en",
}: {
  to: string;
  productName: string;
  productSlug: string;
  locale?: string;
}): Promise<void> {
  if (!isConfigured()) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const productUrl = `${siteUrl}/${locale}/products/${productSlug}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:24px 32px;">
          <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;letter-spacing:1px;">BACK IN STOCK</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#F0E6FF;font-size:16px;margin:0 0 8px;">Good news! <strong style="color:#A855F7;">${escapeHtml(productName)}</strong> is back in stock.</p>
          <p style="color:#9CA3AF;font-size:14px;margin:0 0 24px;">
            You subscribed to restock alerts for this item. Grab yours before it sells out again!
          </p>
          <div style="text-align:center;">
            <a href="${escapeHtml(productUrl)}"
               style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:700;">
              View Product →
            </a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
          <p style="color:#6B7280;font-size:12px;margin:0;">Questions? Contact support@mysticlab.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const res = await resend.emails.send({
    from: FROM,
    to,
    subject: `${productName} is back in stock — Mystic Lab`,
    html,
  });
  logSendResult("restock", res);
}
```

### Step 3: 재입고 알림 구독/취소 API

`app/api/restock-alert/route.ts` 신규 생성:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { productId, email } = await req.json();

  if (!productId || !email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("restock_alerts")
    .upsert(
      { product_id: productId, email: email.toLowerCase(), user_id: user?.id ?? null },
      { onConflict: "product_id,email", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[restock-alert] upsert error:", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { productId, email } = await req.json();

  if (!productId || !email) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const supabase = await createClient();

  await supabase
    .from("restock_alerts")
    .delete()
    .eq("product_id", productId)
    .eq("email", (email as string).toLowerCase());

  return NextResponse.json({ ok: true });
}
```

### Step 4: Cron 재입고 알림 발송 API

`app/api/cron/restock-notify/route.ts` 신규 생성:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRestockNotification } from "@/lib/resend";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 재고 있는 상품 중 미발송 알림 조회
  const { data: alerts, error } = await supabase
    .from("restock_alerts")
    .select("id, email, product_id, products(slug, price_usd, stock, product_translations(name, language))")
    .is("notified_at", null)
    .limit(100);

  if (error) {
    console.error("[restock-notify] fetch error:", error.message);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  let sent = 0;
  const toMark: string[] = [];

  for (const alert of (alerts ?? []) as {
    id: string;
    email: string;
    product_id: string;
    products: {
      slug: string;
      price_usd: number;
      stock: number;
      product_translations: { name: string; language: string }[];
    } | null;
  }[]) {
    const product = alert.products;
    if (!product || product.stock <= 0) continue;

    const name =
      product.product_translations?.find((t) => t.language === "en")?.name ??
      product.slug;

    await sendRestockNotification({
      to: alert.email,
      productName: name,
      productSlug: product.slug,
    }).catch((e) => console.error("[restock-notify] send failed:", e));

    toMark.push(alert.id);
    sent++;
  }

  if (toMark.length > 0) {
    await supabase
      .from("restock_alerts")
      .update({ notified_at: new Date().toISOString() })
      .in("id", toMark);
  }

  return NextResponse.json({ sent });
}
```

### Step 5: RestockAlert UI 컴포넌트

`components/products/RestockAlert.tsx` 신규 생성:

```tsx
"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface RestockAlertProps {
  productId: string;
  userEmail: string | null;
}

export default function RestockAlert({ productId, userEmail }: RestockAlertProps) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/restock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubscribed(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      await fetch("/api/restock-alert", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }

  if (subscribed) {
    return (
      <div className="mt-4 flex items-center gap-3 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3">
        <Bell className="w-4 h-4 text-[#A855F7] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[#F0E6FF] text-sm font-medium">You&apos;ll be notified when this item is back.</p>
          <p className="text-[#6B7280] text-xs truncate">{email}</p>
        </div>
        <button
          onClick={unsubscribe}
          disabled={loading}
          className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors flex-shrink-0"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellOff className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-[#13131F] border border-[#2D2D4E] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-[#9CA3AF]" />
        <p className="text-[#9CA3AF] text-sm">Notify me when back in stock</p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-[#0D0D1A] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
        />
        <button
          onClick={subscribe}
          disabled={loading}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Notify Me
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
```

### Step 6: product page에 RestockAlert 연결

`app/[locale]/products/[slug]/page.tsx`에서:

1. 로그인 유저 이메일 가져오기 — `isLoggedIn = true` 블록 안에서 `user.email` 사용 가능. 페이지 상단에 변수 추가:
```tsx
let userEmail: string | null = null;
```

2. `const { data: { user } } = await supabase.auth.getUser();` 다음 줄에:
```tsx
if (user) {
  isLoggedIn = true;
  userEmail = user.email ?? null;
  // ... 기존 코드 유지
```

3. import에 추가:
```tsx
import RestockAlert from "@/components/products/RestockAlert";
```

4. `ProductDetail`에 전달하지 않고, `ProductDetail` 컴포넌트 안의 out-of-stock 표시 영역 대신 page 레벨에서 렌더. 그러나 `ProductDetail`은 client 컴포넌트로 내부 구조 접근이 어려우므로, `RestockAlert`를 `ProductDetail` 다음에 조건부 렌더:

```tsx
{product.stock === 0 && (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <RestockAlert productId={product.id} userEmail={userEmail} />
  </div>
)}
```

**참고**: `ProductDetail` 컴포넌트 안에서 이미 stock=0 처리를 하고 있을 수 있다. 위치가 중복되면 `ProductDetail` 내부에 prop으로 전달하는 방식으로 변경. 그러나 우선 page 레벨에서 렌더해서 동작 확인 후 리팩토링.

- [ ] **Step 7: 마이그레이션 Supabase 적용**

Supabase SQL Editor에서 `053_restock_alerts.sql` 내용을 실행한다.

- [ ] **Step 8: 로컬 테스트**

```
npm run dev
```
1. 재고 0인 상품 페이지 방문 → "Notify me when back in stock" 섹션 표시 확인
2. 이메일 입력 후 "Notify Me" 클릭 → "You'll be notified..." 상태 전환 확인
3. Supabase에서 `restock_alerts` 테이블에 행이 삽입됐는지 확인

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/053_restock_alerts.sql \
        app/api/restock-alert/route.ts \
        app/api/cron/restock-notify/route.ts \
        components/products/RestockAlert.tsx \
        lib/resend/index.ts \
        "app/[locale]/products/[slug]/page.tsx"
git commit -m "feat: restock alert subscriptions — DB, API, UI, cron email"
```

---

## Task 5: 최종 통합 Push

- [ ] **Step 1: 전체 빌드 확인**

```
npm run build
```
오류 없이 빌드 완료 확인.

- [ ] **Step 2: Vercel Push**

```bash
git push origin main
```
Vercel 자동 배포 → https://mystic-lab.vercel.app 에서 각 기능 동작 확인.

---

## 기능 검증 체크리스트

- [ ] 검색창에 상품명에 없고 설명에만 있는 단어 입력 시 결과 표시됨
- [ ] 상품 상세 → 다른 상품 상세 방문 → 첫 번째 상품에서 "Recently Viewed" 섹션에 표시됨
- [ ] 같은 카테고리 상품이 있으면 "You May Also Like" 표시, 없으면 숨김
- [ ] 재고 0 상품에서 이메일 입력 후 알림 구독 성공 → Supabase 행 확인
- [ ] 재고가 생긴 상품 대상으로 `/api/cron/restock-notify` GET (Authorization: Bearer {CRON_SECRET}) → 이메일 발송 및 `notified_at` 업데이트 확인
