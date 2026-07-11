# Large File Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 800줄 초과 파일을 800줄 이하로 분리 — analytics 페이지(859줄), checkout 페이지(1019줄), FirmwareClient(748줄) 우선

**Architecture:** analytics는 헬퍼 함수와 차트 컴포넌트를 별도 파일로 추출. checkout은 상태/로직을 커스텀 훅으로 추출. FirmwareClient는 폼 섹션을 분리.

**Tech Stack:** Next.js 16 App Router, React, TypeScript

---

## Task 1: Analytics — 헬퍼 함수 분리

**Files:**
- Create: `lib/admin/analytics-helpers.ts`
- Modify: `app/admin/analytics/page.tsx` (헬퍼 import로 교체)

**배경:** `app/admin/analytics/page.tsx` 상단의 `getLtv`, `getBuyerSegments`, `getCustomerSegments`, `getDailyRevenue` 함수(1~96번 줄)는 데이터 변환 로직이다. UI와 무관하므로 lib으로 이동.

- [ ] **Step 1: lib/admin/analytics-helpers.ts 생성**

`app/admin/analytics/page.tsx`의 1~96번 줄(interface 포함)에서 헬퍼 함수들을 그대로 복사:

```ts
// lib/admin/analytics-helpers.ts

export interface OrderRow {
  total_usd: number;
  status: string;
  created_at: string;
  customer_email: string;
}

export interface OrderItemRow {
  product_id: string | null;
  quantity: number;
  price_usd: number;
  products: { slug: string; product_translations: { name: string; language: string }[] } | null;
}

export interface SegBucket {
  label: string;
  customers: number;
  revenue: number;
  share: number;
}

export function getLtv(orders: OrderRow[]) {
  const map: Record<string, { email: string; total: number; count: number }> = {};
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    const e = o.customer_email;
    if (!map[e]) map[e] = { email: e, total: 0, count: 0 };
    map[e].total += o.total_usd;
    map[e].count += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
}

export function getBuyerSegments(orders: OrderRow[]) {
  const map: Record<string, number> = {};
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    map[o.customer_email] = (map[o.customer_email] ?? 0) + 1;
  }
  const values = Object.values(map);
  return {
    newBuyers: values.filter((n) => n === 1).length,
    returning: values.filter((n) => n > 1).length,
  };
}

export function getCustomerSegments(orders: OrderRow[]) {
  const map: Record<string, { total: number; count: number }> = {};
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    if (!map[o.customer_email]) map[o.customer_email] = { total: 0, count: 0 };
    map[o.customer_email].total += o.total_usd;
    map[o.customer_email].count += 1;
  }
  const custs = Object.values(map);
  const totalRev = custs.reduce((s, c) => s + c.total, 0) || 1;

  const bucketize = (defs: { label: string; test: (c: { total: number; count: number }) => boolean }[]): SegBucket[] =>
    defs.map((d) => {
      const inSeg = custs.filter(d.test);
      const revenue = inSeg.reduce((s, c) => s + c.total, 0);
      return { label: d.label, customers: inSeg.length, revenue, share: Math.round((revenue / totalRev) * 100) };
    });

  const frequency = bucketize([
    { label: "1회 구매", test: (c) => c.count === 1 },
    { label: "2~3회", test: (c) => c.count >= 2 && c.count <= 3 },
    { label: "4회 이상", test: (c) => c.count >= 4 },
  ]);
  const spend = bucketize([
    { label: "$50 미만", test: (c) => c.total < 50 },
    { label: "$50~149", test: (c) => c.total >= 50 && c.total < 150 },
    { label: "$150~499", test: (c) => c.total >= 150 && c.total < 500 },
    { label: "$500 이상", test: (c) => c.total >= 500 },
  ]);
  return { frequency, spend, totalCustomers: custs.length };
}

export function getDailyRevenue(orders: OrderRow[], days = 30) {
  const map: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }
  for (const o of orders) {
    if (!["paid", "shipped", "completed"].includes(o.status)) continue;
    const key = o.created_at.slice(0, 10);
    if (key in map) map[key] += o.total_usd;
  }
  return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
}
```

- [ ] **Step 2: analytics/page.tsx 상단 헬퍼 제거 + import 추가**

`app/admin/analytics/page.tsx` 파일에서:

1. 1번 줄 `import { createAdminClient }` 위에 추가:
```ts
import { getLtv, getBuyerSegments, getCustomerSegments, getDailyRevenue, type OrderRow, type OrderItemRow, type SegBucket } from "@/lib/admin/analytics-helpers";
```

2. 1~96번 줄의 `interface OrderRow`, `interface OrderItemRow`, `interface SegBucket`, `getLtv`, `getBuyerSegments`, `getCustomerSegments`, `getDailyRevenue` 함수 정의 전체를 삭제.

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공.

---

## Task 2: Analytics — 차트 컴포넌트 분리

**Files:**
- Create: `components/admin/charts/VisitorChart.tsx`
- Create: `components/admin/charts/RevenueChart.tsx`
- Create: `components/admin/charts/StatCard.tsx`
- Modify: `app/admin/analytics/page.tsx`

**배경:** `VisitorChart`(98~131번 줄), `RevenueChart`(133~192번 줄), `StatCard`(194~227번 줄)는 순수 렌더 컴포넌트. 별도 파일로 분리.

- [ ] **Step 1: VisitorChart 분리**

`app/admin/analytics/page.tsx`의 `VisitorChart` 함수(98~131번 줄) 전체를 그대로 새 파일에 복사:

```tsx
// components/admin/charts/VisitorChart.tsx

interface VisitorChartProps {
  data: { date: string; [k: string]: number | string }[];
  dataKey: string;
  label: string;
  color: string;
}

export default function VisitorChart({ data, dataKey, label, color }: VisitorChartProps) {
  const W = 640;
  const H = 140;
  const pad = { top: 10, right: 8, bottom: 24, left: 40 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxV = Math.max(...data.map((d) => d[dataKey] as number), 1);
  const barW = Math.max(1, chartW / data.length - 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "160px" }}>
      {[0, 0.5, 1].map((frac) => {
        const y = pad.top + chartH * (1 - frac);
        return (
          <g key={frac}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#2D2D4E" strokeWidth={1} />
            <text x={pad.left - 4} y={y + 4} fill="#6B7280" fontSize={9} textAnchor="end">
              {Math.round(maxV * frac)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const v = d[dataKey] as number;
        const x = pad.left + i * (chartW / data.length) + 1;
        const barH = (v / maxV) * chartH;
        const y = pad.top + chartH - barH;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={barH} rx={2} fill={v > 0 ? color : "#1A1A2E"} />
            {i % 5 === 0 && (
              <text x={x + barW / 2} y={H - 4} fill="#6B7280" fontSize={8} textAnchor="middle">
                {String(d.date).slice(5)}
              </text>
            )}
          </g>
        );
      })}
      <text x={pad.left} y={pad.top - 1} fill="#9CA3AF" fontSize={9}>
        {label}
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: RevenueChart 분리**

```tsx
// components/admin/charts/RevenueChart.tsx

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const W = 640;
  const H = 160;
  const pad = { top: 12, right: 8, bottom: 24, left: 48 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const barW = Math.max(1, chartW / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: "200px" }}>
      {[0, 0.5, 1].map((frac) => {
        const y = pad.top + chartH * (1 - frac);
        const val = maxRev * frac;
        return (
          <g key={frac}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#2D2D4E" strokeWidth={1} />
            <text x={pad.left - 4} y={y + 4} fill="#6B7280" fontSize={9} textAnchor="end">
              ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pad.left + i * (chartW / data.length) + 1;
        const barH = (d.revenue / maxRev) * chartH;
        const y = pad.top + chartH - barH;
        const isWeekend = new Date(d.date).getDay() % 6 === 0;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              fill={d.revenue > 0 ? (isWeekend ? "#A855F7" : "#7C3AED") : "#1A1A2E"}
            />
            {i % 5 === 0 && (
              <text x={x + barW / 2} y={H - 4} fill="#6B7280" fontSize={8} textAnchor="middle">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 3: StatCard 분리**

```tsx
// components/admin/charts/StatCard.tsx

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "#1A1A2E", borderColor: highlight ? "#A855F7" : "#2D2D4E" }}
    >
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: highlight ? "#A855F7" : "#F0E6FF" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: analytics/page.tsx에서 3개 컴포넌트 import로 교체**

`app/admin/analytics/page.tsx` 상단 import 블록에 추가:
```ts
import VisitorChart from "@/components/admin/charts/VisitorChart";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import StatCard from "@/components/admin/charts/StatCard";
```

페이지 파일에서 `VisitorChart`, `RevenueChart`, `StatCard` 함수 정의 전체 삭제 (98~227번 줄).

- [ ] **Step 5: 빌드 확인 + 커밋**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공. analytics/page.tsx가 600줄 이하로 줄어야 함.

```bash
git add lib/admin/analytics-helpers.ts \
        components/admin/charts/VisitorChart.tsx \
        components/admin/charts/RevenueChart.tsx \
        components/admin/charts/StatCard.tsx \
        app/admin/analytics/page.tsx
git commit -m "refactor(analytics): extract helpers and chart components into separate files"
```

---

## Task 3: Checkout — 상태/로직을 useCheckoutState 훅으로 추출

**Files:**
- Create: `hooks/useCheckoutState.ts`
- Modify: `app/[locale]/checkout/page.tsx`

**배경:** checkout/page.tsx(1019줄)는 30개 이상의 useState와 여러 async 함수가 하나의 컴포넌트에 있다. 상태와 로직을 훅으로 추출하면 페이지는 JSX만 담당하게 된다.

**주의:** 먼저 `app/[locale]/checkout/page.tsx` 전체를 읽어 state 변수 목록과 함수 목록을 파악한 뒤 진행한다.

- [ ] **Step 1: 파일 전체 읽기**

`app/[locale]/checkout/page.tsx` 전체를 읽어 다음을 파악:
- 모든 `useState` 선언 (95~215번 줄 예상)
- 모든 `useEffect` (mounted, locale, items, supabase 로직)
- 모든 함수 (applyCoupon, removeCoupon, handleLemonPay, handleTossPay 등)
- `return` 문 이전까지의 로직 경계

- [ ] **Step 2: hooks/useCheckoutState.ts 생성**

파일에서 읽은 내용을 바탕으로, `return (...)` 이전의 모든 state + logic을 이 훅으로 이동:

```ts
// hooks/useCheckoutState.ts
"use client";

// 모든 import를 page.tsx에서 이동
import { useState, useEffect, useRef } from "react";
// ... (page.tsx 상단 import에서 필요한 것만)

// page.tsx에서 가져온 타입들
import type { CartItem } from "@/lib/payments/types";
// ... etc

export interface CheckoutStateReturn {
  locale: string;
  items: CartItem[];
  mounted: boolean;
  // ... 모든 state와 setter
  applyCoupon: (codeArg?: string) => Promise<void>;
  removeCoupon: () => void;
  // ... 모든 함수
}

export function useCheckoutState(paramsPromise: Promise<{ locale: string }>): CheckoutStateReturn {
  // page.tsx의 모든 useState를 그대로 복사
  // page.tsx의 모든 useEffect를 그대로 복사
  // page.tsx의 모든 함수를 그대로 복사

  return {
    locale, setLocale,
    items, setItems,
    mounted,
    // ... 모든 state + setter + 함수
  };
}
```

**⚠️ 주의:** `useRef`(lsScriptReady 등)도 함께 이동. 단, `useRouter`는 페이지에 남겨두는 게 더 단순하다면 남겨도 됨.

- [ ] **Step 3: page.tsx에서 훅 호출로 교체**

`app/[locale]/checkout/page.tsx`에서 모든 state/logic 선언을 삭제하고:

```tsx
export default function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const state = useCheckoutState(params);
  const { locale, items, mounted, track, setTrack, email, setEmail, /* ... */ } = state;

  if (!mounted) return <LoadingScreen />;
  if (items.length === 0 && mounted) return <EmptyCart locale={locale} />;

  return (
    // 기존 JSX 그대로 유지
  );
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공. page.tsx가 600줄 이하로 줄어야 함 (JSX + 훅 호출만 남음).

- [ ] **Step 5: 커밋**

```bash
git add hooks/useCheckoutState.ts "app/[locale]/checkout/page.tsx"
git commit -m "refactor(checkout): extract state and logic into useCheckoutState hook"
```

---

## Task 4: FirmwareClient — 장치 목록 섹션 분리

**Files:**
- Create: `components/admin/FirmwareDeviceList.tsx`
- Modify: `components/admin/FirmwareClient.tsx`

**배경:** FirmwareClient.tsx(748줄). 주요 섹션: 업로드 폼, 장치 목록/버전 히스토리. 장치 목록을 별도 컴포넌트로 추출.

**주의:** 먼저 `components/admin/FirmwareClient.tsx`를 읽어 장치 목록 JSX의 정확한 줄 범위와 필요한 props를 파악한다.

- [ ] **Step 1: 파일 읽기**

`components/admin/FirmwareClient.tsx` 전체를 읽어:
- 장치 목록/히스토리를 렌더링하는 JSX 섹션의 시작/끝 줄 파악
- 해당 섹션이 사용하는 state/props/함수 파악

- [ ] **Step 2: FirmwareDeviceList.tsx 생성**

읽은 내용을 바탕으로 장치 목록 섹션을 별도 컴포넌트로 추출.

필요한 props interface 정의:
```tsx
// components/admin/FirmwareDeviceList.tsx
"use client";

interface Device {
  id: string;
  label: string;
  // ... FirmwareClient에서 사용하는 장치 타입
}

interface FirmwareDeviceListProps {
  devices: Device[];
  // ... 필요한 props
}

export default function FirmwareDeviceList({ devices, /* ... */ }: FirmwareDeviceListProps) {
  return (
    // 장치 목록 JSX
  );
}
```

- [ ] **Step 3: FirmwareClient에서 import + 기존 코드 삭제**

FirmwareClient.tsx에서:
```tsx
import FirmwareDeviceList from "./FirmwareDeviceList";
```

장치 목록 JSX를 `<FirmwareDeviceList devices={devices} ... />` 로 교체.

- [ ] **Step 4: 빌드 확인 + 커밋**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공. FirmwareClient.tsx가 550줄 이하여야 함.

```bash
git add components/admin/FirmwareDeviceList.tsx components/admin/FirmwareClient.tsx
git commit -m "refactor(firmware): extract device list into FirmwareDeviceList component"
```

---

## 완료 체크리스트

- [ ] `analytics/page.tsx` 600줄 이하
- [ ] `checkout/page.tsx` 600줄 이하 (JSX만 남음)
- [ ] `FirmwareClient.tsx` 550줄 이하
- [ ] `lib/admin/analytics-helpers.ts` 존재
- [ ] `components/admin/charts/` 3개 파일 존재
- [ ] `hooks/useCheckoutState.ts` 존재
- [ ] `npm run build` 성공
- [ ] 어드민 분석 페이지 정상 렌더링
- [ ] 체크아웃 흐름 정상 동작
