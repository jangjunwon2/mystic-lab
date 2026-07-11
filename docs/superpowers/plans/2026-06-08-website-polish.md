# Website Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라이브 사이트의 누락된 OG 이미지, 보안 취약점, i18n 미처리 컴포넌트, 에러/로딩 UI, SEO 메타데이터를 순서대로 수정한다.

**Architecture:** 독립적인 5개 작업 묶음. 각 태스크는 서로 의존하지 않으므로 완료 순서 무관. RestockAlert·ReviewForm은 같은 messages 파일을 수정하므로 태스크 3으로 묶음.

**Tech Stack:** Next.js 16 App Router, next/og(ImageResponse), next-intl v4, Tailwind v4, Supabase, lib/rate-limit(체크레이트리밋)

---

## Task 1: OG 이미지 생성

**Problem:** `app/layout.tsx:37,48`에서 `/og-image.png`를 참조하지만 `public/` 폴더에 파일이 없어 SNS 공유 시 이미지가 404.

**Files:**
- Create: `app/opengraph-image.tsx`
- Modify: `app/layout.tsx`

---

- [ ] **Step 1: opengraph-image.tsx 생성**

`app/opengraph-image.tsx` 파일을 아래 내용으로 생성:

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mystic Lab — Professional Magic Shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 50%, #0D0D1A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {/* 로고 */}
        <div
          style={{
            fontSize: 20,
            color: "#A855F7",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 24,
            display: "flex",
          }}
        >
          ✦ MYSTIC LAB ✦
        </div>
        {/* 헤드라인 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#F0E6FF",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
            display: "flex",
          }}
        >
          Professional Magic Shop
        </div>
        {/* 서브타이틀 */}
        <div
          style={{
            fontSize: 24,
            color: "#9CA3AF",
            marginTop: 24,
            textAlign: "center",
            maxWidth: 700,
            display: "flex",
          }}
        >
          Premium props & electronic devices for magicians worldwide
        </div>
        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 16,
            color: "#4B5563",
            display: "flex",
          }}
        >
          mystic-lab.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: layout.tsx의 OG 이미지 URL 수정**

`app/layout.tsx`에서 `/og-image.png` 두 곳을 `/opengraph-image`로 교체:

```tsx
// 수정 전 (line 37)
url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app"}/og-image.png`,
// 수정 후
url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app"}/opengraph-image`,

// 수정 전 (line 48)
images: [`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app"}/og-image.png`],
// 수정 후
images: [`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app"}/opengraph-image`],
```

- [ ] **Step 3: 로컬에서 확인**

```bash
npm run dev
# 브라우저에서 http://localhost:3000/opengraph-image 접속 → 1200×630 이미지 렌더링 확인
```

- [ ] **Step 4: 커밋**

```bash
git add app/opengraph-image.tsx app/layout.tsx
git commit -m "feat: add dynamic OG image via ImageResponse"
```

---

## Task 2: /api/unlock Rate Limit 추가

**Problem:** `app/api/unlock/route.ts`에 rate limit이 없어 SHA-256 코드 브루트포스 가능. IP당 10회/15분으로 제한.

**Files:**
- Modify: `app/api/unlock/route.ts`

---

- [ ] **Step 1: rate limit 추가**

`app/api/unlock/route.ts`의 `POST` 함수 상단에 추가:

```ts
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // IP당 15분에 10회 제한
  const ip = getClientIP(request);
  const allowed = await checkRateLimit(`unlock:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    // ... 기존 코드 그대로
```

전체 파일은 아래와 같이 됨 (import 추가 + 함수 상단 블록 추가):

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { generateSignedUrl } from "@/lib/cloudflare/stream";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

type UnlockCode = {
  id: string;
  product_id: string;
  first_used_at: string | null;
};

type SolutionVideoRow = {
  cloudflare_stream_id: string;
  title: string | null;
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const allowed = await checkRateLimit(`unlock:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { code, productId } = await request.json();
    // ... 이하 기존 코드 그대로
```

- [ ] **Step 2: 커밋**

```bash
git add app/api/unlock/route.ts
git commit -m "fix(security): add rate limit to unlock API — 10 attempts per IP per 15 min"
```

---

## Task 3: RestockAlert + ReviewForm i18n 처리

**Problem:** 두 컴포넌트 전체가 영문 하드코딩. 7개 언어 messages 파일에 키를 추가하고 `useTranslations`로 교체.

**Files:**
- Modify: `components/products/RestockAlert.tsx`
- Modify: `components/products/ReviewForm.tsx`
- Modify: `messages/en.json`, `messages/ko.json`, `messages/ja.json`, `messages/zh-CN.json`, `messages/es.json`, `messages/fr.json`, `messages/de.json`

---

- [ ] **Step 1: messages/en.json에 키 추가**

`messages/en.json`의 `"products"` 섹션 마지막에 추가 (예: `"youMayAlsoLike"` 다음):

```json
"restockAlert": {
  "notify": "Notify me when back in stock",
  "button": "Notify Me",
  "invalidEmail": "Please enter a valid email.",
  "error": "Something went wrong. Please try again.",
  "success": "You'll be notified when this item is back.",
  "cancel": "Cancel notification"
},
"reviewForm": {
  "title": "Share your experience",
  "placeholder": "Write your review (optional)...",
  "ratingRequired": "Please select a rating.",
  "success": "Thank you! Your review has been posted.",
  "submit": "Submit Review",
  "submitting": "Submitting…",
  "failed": "Failed to submit."
}
```

- [ ] **Step 2: messages/ko.json에 동일 키 추가**

```json
"restockAlert": {
  "notify": "재입고 시 알림 받기",
  "button": "알림 신청",
  "invalidEmail": "유효한 이메일 주소를 입력해 주세요.",
  "error": "오류가 발생했습니다. 다시 시도해 주세요.",
  "success": "재입고 시 이메일로 알려드리겠습니다.",
  "cancel": "알림 취소"
},
"reviewForm": {
  "title": "사용 후기를 남겨주세요",
  "placeholder": "리뷰를 작성해 주세요 (선택)...",
  "ratingRequired": "별점을 선택해 주세요.",
  "success": "리뷰가 등록되었습니다. 감사합니다!",
  "submit": "리뷰 등록",
  "submitting": "등록 중…",
  "failed": "등록에 실패했습니다."
}
```

- [ ] **Step 3: messages/ja.json에 동일 키 추가**

```json
"restockAlert": {
  "notify": "再入荷時に通知を受け取る",
  "button": "通知を登録",
  "invalidEmail": "有効なメールアドレスを入力してください。",
  "error": "エラーが発生しました。もう一度お試しください。",
  "success": "再入荷時にメールでお知らせします。",
  "cancel": "通知をキャンセル"
},
"reviewForm": {
  "title": "レビューを書く",
  "placeholder": "レビューを入力してください（任意）...",
  "ratingRequired": "評価を選択してください。",
  "success": "レビューを投稿しました。ありがとうございます！",
  "submit": "レビューを投稿",
  "submitting": "投稿中…",
  "failed": "投稿に失敗しました。"
}
```

- [ ] **Step 4: messages/zh-CN.json에 동일 키 추가**

```json
"restockAlert": {
  "notify": "补货时通知我",
  "button": "订阅通知",
  "invalidEmail": "请输入有效的电子邮件地址。",
  "error": "发生错误，请重试。",
  "success": "补货时我们将通过邮件通知您。",
  "cancel": "取消通知"
},
"reviewForm": {
  "title": "分享您的使用体验",
  "placeholder": "写下您的评价（可选）...",
  "ratingRequired": "请选择评分。",
  "success": "感谢您的评价，已成功发布！",
  "submit": "提交评价",
  "submitting": "提交中…",
  "failed": "提交失败。"
}
```

- [ ] **Step 5: messages/es.json에 동일 키 추가**

```json
"restockAlert": {
  "notify": "Notificarme cuando esté disponible",
  "button": "Notificarme",
  "invalidEmail": "Por favor, introduce un email válido.",
  "error": "Algo salió mal. Por favor, inténtalo de nuevo.",
  "success": "Te avisaremos cuando el artículo esté disponible.",
  "cancel": "Cancelar notificación"
},
"reviewForm": {
  "title": "Comparte tu experiencia",
  "placeholder": "Escribe tu reseña (opcional)...",
  "ratingRequired": "Por favor, selecciona una puntuación.",
  "success": "¡Gracias! Tu reseña ha sido publicada.",
  "submit": "Enviar reseña",
  "submitting": "Enviando…",
  "failed": "No se pudo enviar."
}
```

- [ ] **Step 6: messages/fr.json에 동일 키 추가**

```json
"restockAlert": {
  "notify": "Me notifier lors du réapprovisionnement",
  "button": "Me notifier",
  "invalidEmail": "Veuillez entrer un email valide.",
  "error": "Une erreur s'est produite. Veuillez réessayer.",
  "success": "Vous serez notifié(e) lorsque cet article sera disponible.",
  "cancel": "Annuler la notification"
},
"reviewForm": {
  "title": "Partagez votre expérience",
  "placeholder": "Rédigez votre avis (facultatif)...",
  "ratingRequired": "Veuillez sélectionner une note.",
  "success": "Merci ! Votre avis a été publié.",
  "submit": "Soumettre l'avis",
  "submitting": "Envoi en cours…",
  "failed": "La soumission a échoué."
}
```

- [ ] **Step 7: messages/de.json에 동일 키 추가**

```json
"restockAlert": {
  "notify": "Benachrichtigung bei Wiederverfügbarkeit",
  "button": "Benachrichtigen",
  "invalidEmail": "Bitte gib eine gültige E-Mail-Adresse ein.",
  "error": "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
  "success": "Du wirst benachrichtigt, wenn der Artikel verfügbar ist.",
  "cancel": "Benachrichtigung abbestellen"
},
"reviewForm": {
  "title": "Teile deine Erfahrung",
  "placeholder": "Schreibe deine Bewertung (optional)...",
  "ratingRequired": "Bitte wähle eine Bewertung aus.",
  "success": "Danke! Deine Bewertung wurde veröffentlicht.",
  "submit": "Bewertung absenden",
  "submitting": "Wird gesendet…",
  "failed": "Senden fehlgeschlagen."
}
```

- [ ] **Step 8: RestockAlert.tsx — useTranslations 적용**

`components/products/RestockAlert.tsx` 전체를 다음으로 교체:

```tsx
"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface RestockAlertProps {
  productId: string;
  userEmail: string | null;
}

export default function RestockAlert({ productId, userEmail }: RestockAlertProps) {
  const t = useTranslations("products.restockAlert");
  const [email, setEmail] = useState(userEmail ?? "");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("invalidEmail"));
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
      setError(t("error"));
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
          <p className="text-[#F0E6FF] text-sm font-medium">{t("success")}</p>
          <p className="text-[#6B7280] text-xs truncate">{email}</p>
        </div>
        <button
          onClick={unsubscribe}
          disabled={loading}
          aria-label={t("cancel")}
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
        <p className="text-[#9CA3AF] text-sm">{t("notify")}</p>
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
          {t("button")}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 9: ReviewForm.tsx — useTranslations 적용**

`components/products/ReviewForm.tsx` 전체를 다음으로 교체:

```tsx
"use client";

import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  productId: string;
  hasPurchased: boolean;
}

export default function ReviewForm({ productId, hasPurchased }: Props) {
  const t = useTranslations("products.reviewForm");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!hasPurchased) return null;

  if (submitted) {
    return (
      <div
        className="rounded-xl border p-4 mb-6 flex items-center gap-2 text-sm"
        style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", color: "#10B981" }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        {t("success")}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!rating) {
      setError(t("ratingRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, rating, comment }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("failed"));
    }
  };

  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{ background: "#13131F", borderColor: "rgba(124,58,237,0.3)" }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: "#F0E6FF" }}>
        {t("title")}
      </p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="w-6 h-6"
              style={{
                color: i <= (hover || rating) ? "#F59E0B" : "#374151",
                fill: i <= (hover || rating) ? "#F59E0B" : "none",
              }}
            />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        placeholder={t("placeholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
        style={{ background: "#1A1A2E", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
      />
      {error && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting || !rating}
        className="mt-3 px-5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </div>
  );
}
```

- [ ] **Step 10: 커밋**

```bash
git add messages/ components/products/RestockAlert.tsx components/products/ReviewForm.tsx
git commit -m "feat(i18n): add translations for RestockAlert and ReviewForm — 7 languages"
```

---

## Task 4: 고객 페이지 error.tsx + loading.tsx

**Problem:** `app/[locale]/error.tsx`와 주요 페이지의 `loading.tsx`가 없어 에러 시 Next.js 기본 화면, 느린 네트워크에서 빈 화면 노출.

**Files:**
- Create: `app/[locale]/error.tsx`
- Create: `app/[locale]/products/[slug]/loading.tsx`
- Create: `app/[locale]/account/loading.tsx`

---

- [ ] **Step 1: app/[locale]/error.tsx 생성**

```tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-[#F0E6FF]">
          Something went wrong
        </h2>
        <p className="text-sm text-[#6B7280]">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors bg-[#7C3AED] text-[#F0E6FF] hover:bg-[#6D28D9]"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-[#2D2D4E] text-[#9CA3AF] hover:text-[#F0E6FF]"
        >
          <Home className="w-4 h-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: app/[locale]/products/[slug]/loading.tsx 생성**

```tsx
export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 브레드크럼 */}
        <div className="h-4 w-48 bg-[#1A1A2E] rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 이미지 */}
          <div className="aspect-square bg-[#1A1A2E] rounded-2xl" />
          {/* 상세 정보 */}
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-[#1A1A2E] rounded" />
            <div className="h-6 w-1/4 bg-[#1A1A2E] rounded" />
            <div className="h-4 w-full bg-[#1A1A2E] rounded" />
            <div className="h-4 w-5/6 bg-[#1A1A2E] rounded" />
            <div className="h-4 w-4/6 bg-[#1A1A2E] rounded" />
            <div className="h-12 w-full bg-[#2D2D4E] rounded-xl mt-6" />
            <div className="h-12 w-full bg-[#1A1A2E] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: app/[locale]/account/loading.tsx 생성**

```tsx
export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {/* 헤더 */}
        <div className="h-8 w-48 bg-[#1A1A2E] rounded" />
        {/* 탭 */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-[#1A1A2E] rounded-xl" />
          ))}
        </div>
        {/* 콘텐츠 카드 */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-[#1A1A2E] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add app/[locale]/error.tsx "app/[locale]/products/[slug]/loading.tsx" app/[locale]/account/loading.tsx
git commit -m "feat: add error boundary and loading skeletons for customer pages"
```

---

## Task 5: 주요 페이지 SEO Metadata + hreflang

**Problem:** 홈·상품목록·상품상세 페이지에 `generateMetadata`가 없고, hreflang alternate 태그가 전혀 없어 국제 SEO에 불리.

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/products/page.tsx`
- Modify: `app/[locale]/products/[slug]/page.tsx`

---

- [ ] **Step 1: 홈 페이지 — generateMetadata 추가**

`app/[locale]/page.tsx` 상단에 추가 (imports 아래):

```ts
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

const HOME_META: Record<string, { title: string; description: string }> = {
  en: { title: "Mystic Lab — Professional Magic Shop", description: "Premium magic props and custom electronic devices for professional magicians worldwide." },
  ko: { title: "미스틱 랩 — 프로 마술사 전용 마술 쇼핑몰", description: "전 세계 프로 마술사를 위한 프리미엄 마술 도구와 맞춤 전자 기기." },
  ja: { title: "ミスティック・ラボ — プロマジシャン専用マジックショップ", description: "世界中のプロマジシャン向けのプレミアムマジック用品とカスタム電子機器。" },
  "zh-CN": { title: "神秘实验室 — 专业魔术师专用魔术商店", description: "为全球专业魔术师提供优质魔术道具和定制电子设备。" },
  es: { title: "Mystic Lab — Tienda de Magia Profesional", description: "Accesorios de magia premium y dispositivos electrónicos para magos profesionales de todo el mundo." },
  fr: { title: "Mystic Lab — Boutique de Magie Professionnelle", description: "Accessoires de magie premium et appareils électroniques pour les magiciens professionnels du monde entier." },
  de: { title: "Mystic Lab — Professioneller Zauberladen", description: "Premium-Zauberzubehör und maßgeschneiderte elektronische Geräte für professionelle Zauberer weltweit." },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = HOME_META[locale] ?? HOME_META.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}`])),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}`,
    },
  };
}
```

- [ ] **Step 2: 상품 목록 페이지 — generateMetadata 추가**

`app/[locale]/products/page.tsx` 상단에 추가:

```ts
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

const PRODUCTS_META: Record<string, { title: string; description: string }> = {
  en: { title: "All Products", description: "Browse our full collection of premium magic props and custom electronic devices." },
  ko: { title: "전체 상품", description: "프리미엄 마술 도구와 전자 기기 전체 컬렉션을 둘러보세요." },
  ja: { title: "全商品", description: "プレミアムマジック用品とカスタム電子機器のコレクションをご覧ください。" },
  "zh-CN": { title: "全部商品", description: "浏览我们完整的优质魔术道具和定制电子设备系列。" },
  es: { title: "Todos los Productos", description: "Explora nuestra colección completa de accesorios de magia premium y dispositivos electrónicos." },
  fr: { title: "Tous les Produits", description: "Parcourez notre collection complète d'accessoires de magie premium et d'appareils électroniques." },
  de: { title: "Alle Produkte", description: "Durchstöbern Sie unsere komplette Sammlung an Premium-Zauberzubehör und elektronischen Geräten." },
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = PRODUCTS_META[locale] ?? PRODUCTS_META.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/products`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/products`])),
    },
    openGraph: {
      title: `${meta.title} | Mystic Lab`,
      description: meta.description,
      url: `${SITE_URL}/${locale}/products`,
    },
  };
}
```

- [ ] **Step 3: 상품 상세 페이지 — generateMetadata 추가**

`app/[locale]/products/[slug]/page.tsx`에 추가. 이미 있는 `createClient` import를 활용해 상품 이름·설명을 Supabase에서 가져옴:

```ts
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: product } = await supabase
    .from("products")
    .select("thumbnail_url, product_translations(name, short_description, language)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const translation =
    product?.product_translations?.find((t: { language: string }) => t.language === locale) ??
    product?.product_translations?.find((t: { language: string }) => t.language === "en");

  const title = translation?.name ?? "Product";
  const description = translation?.short_description ?? "Premium magic prop from Mystic Lab.";
  const image = product?.thumbnail_url ?? `${SITE_URL}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/products/${slug}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/products/${slug}`])),
    },
    openGraph: {
      title: `${title} | Mystic Lab`,
      description,
      url: `${SITE_URL}/${locale}/products/${slug}`,
      images: [{ url: image, width: 800, height: 800, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mystic Lab`,
      description,
      images: [image],
    },
  };
}
```

- [ ] **Step 4: 커밋**

```bash
git add "app/[locale]/page.tsx" "app/[locale]/products/page.tsx" "app/[locale]/products/[slug]/page.tsx"
git commit -m "feat(seo): add generateMetadata and hreflang to home, products, product detail pages"
```

- [ ] **Step 5: 배포 후 확인**

```bash
git push origin main
# 배포 후 아래 URL들로 확인:
# curl -s https://mystic-lab.vercel.app/ko | grep -i "og:title"
# curl -s https://mystic-lab.vercel.app/ko | grep -i "hreflang"
```

---

## 완료 후 최종 확인 체크리스트

- [ ] `/opengraph-image` 접속 시 1200×630 이미지 렌더링 확인
- [ ] SNS 공유 미리보기(Open Graph Debugger 등)에서 이미지 표시 확인
- [ ] `/api/unlock`에 잘못된 코드를 11회 연속 전송 → 429 응답 확인
- [ ] 한국어(`/ko/products/[slug]`) 상품 상세에서 RestockAlert 버튼 텍스트가 "알림 신청"으로 표시되는지 확인
- [ ] 한국어에서 ReviewForm의 별점 미선택 후 제출 시 "별점을 선택해 주세요." 표시 확인
- [ ] 느린 네트워크 시뮬레이션에서 `/ko/products/[slug]` 접속 → skeleton 로딩 화면 표시 확인
- [ ] 구글 검색 콘솔에서 hreflang 경고 없음 확인 (배포 후 수일 내)
