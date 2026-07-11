# Security & UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** XSS 취약점 제거, Zod 입력 검증 추가, window.confirm/prompt를 커스텀 모달로 교체

**Architecture:** TriggerCouponCard XSS는 1줄 수정. Zod는 announcements 라우트에 집중(settings/coupons는 기존 검증 충분). 모달은 ConfirmDialog + PromptDialog 컴포넌트 + useAdminDialogs 훅으로 4개 관리자 컴포넌트에 적용.

**Tech Stack:** React 18, Next.js 16 App Router, TypeScript, Zod (신규 설치), Tailwind v4

---

## Task 1: XSS 제거 — TriggerCouponCard

**Files:**
- Modify: `components/admin/TriggerCouponCard.tsx:65`

**배경:** `description` prop은 부모가 하드코딩한 한국어 문자열이라 HTML이 아님. `dangerouslySetInnerHTML` 불필요.

- [ ] **Step 1: 수정**

`components/admin/TriggerCouponCard.tsx` 65번 줄을 다음으로 교체:

```tsx
// 변경 전
<p className="text-xs mb-4" style={{ color: "#9CA3AF" }} dangerouslySetInnerHTML={{ __html: description }} />

// 변경 후
<p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>{description}</p>
```

- [ ] **Step 2: 빌드 확인**

```bash
cd C:\Users\jun92\Desktop\mystic-lab
npm run build 2>&1 | tail -20
```

Expected: build 성공, type error 없음.

- [ ] **Step 3: 커밋**

```bash
git add components/admin/TriggerCouponCard.tsx
git commit -m "fix(security): remove dangerouslySetInnerHTML from TriggerCouponCard"
```

---

## Task 2: Zod 설치 + announcements 라우트 검증

**Files:**
- Modify: `package.json` (zod 추가)
- Modify: `app/api/admin/announcements/route.ts`

**배경:** announcements POST는 `message` 유무만 체크. `link_url`, `is_active`, `ends_at` 등 타입 검증 없음.

- [ ] **Step 1: Zod 설치**

```bash
npm install zod
```

Expected: `package.json`에 `"zod": "^x.x.x"` 추가됨.

- [ ] **Step 2: announcements/route.ts 수정**

`app/api/admin/announcements/route.ts` 전체를 다음으로 교체:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { translateAnnouncement } from "@/lib/auto-translate";

const AnnouncementSchema = z.object({
  message: z.string().min(1).max(500),
  link_url: z.string().url().optional().nullable(),
  link_label: z.string().max(60).optional().nullable(),
  is_active: z.boolean().optional(),
  starts_at: z.string().datetime({ offset: true }).optional().nullable(),
  ends_at: z.string().datetime({ offset: true }).optional().nullable(),
  coupon_code: z.string().max(32).optional().nullable(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = AnnouncementSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "잘못된 입력값입니다." },
      { status: 400 }
    );
  }

  const { message, link_url, link_label, is_active, starts_at, ends_at, coupon_code } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const translations = await translateAnnouncement(message);

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      message,
      link_url: link_url ?? null,
      link_label: link_label ?? null,
      is_active: is_active ?? true,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
      coupon_code: coupon_code ?? null,
      translations: Object.keys(translations).length ? translations : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Request failed." }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공.

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json app/api/admin/announcements/route.ts
git commit -m "feat(validation): add Zod schema to announcements API route"
```

---

## Task 3: ConfirmDialog 컴포넌트 생성

**Files:**
- Create: `components/admin/ui/ConfirmDialog.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/admin/ui/ConfirmDialog.tsx
"use client";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = "확인",
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-6 shadow-2xl"
        style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-2" style={{ color: "#F0E6FF" }}>
          {title}
        </h2>
        <p className="text-sm mb-6 whitespace-pre-line" style={{ color: "#9CA3AF" }}>
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
            style={{ background: "#2D2D4E", color: "#9CA3AF" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: destructive ? "#EF4444" : "#7C3AED", color: "#fff" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit --pretty false 2>&1 | tail -20
```

Expected: 오류 없음.

---

## Task 4: PromptDialog 컴포넌트 생성

**Files:**
- Create: `components/admin/ui/PromptDialog.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// components/admin/ui/PromptDialog.tsx
"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptDialog({
  open,
  title = "입력",
  message,
  placeholder = "",
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState("");

  if (!open) return null;

  function handleConfirm() {
    onConfirm(value);
    setValue("");
  }

  function handleCancel() {
    setValue("");
    onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-6 shadow-2xl"
        style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-2" style={{ color: "#F0E6FF" }}>
          {title}
        </h2>
        <p className="text-sm mb-3 whitespace-pre-line" style={{ color: "#9CA3AF" }}>
          {message}
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none"
          style={{
            background: "#13131F",
            border: "1px solid #2D2D4E",
            color: "#F0E6FF",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
            style={{ background: "#2D2D4E", color: "#9CA3AF" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: destructive ? "#EF4444" : "#7C3AED", color: "#fff" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 5: useAdminDialogs 훅 생성

**Files:**
- Create: `hooks/useAdminDialogs.ts`

이 훅은 Promise 기반 API를 제공해 `window.confirm`/`window.prompt`처럼 `await`으로 사용 가능.

- [ ] **Step 1: 파일 생성**

```ts
// hooks/useAdminDialogs.ts
"use client";

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

interface PromptState extends PromptOptions {
  resolve: (v: string | null) => void;
}

export function useAdminDialogs() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const showPrompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({ ...options, resolve });
    });
  }, []);

  function handleConfirmYes() {
    confirmState?.resolve(true);
    setConfirmState(null);
  }

  function handleConfirmNo() {
    confirmState?.resolve(false);
    setConfirmState(null);
  }

  function handlePromptConfirm(value: string) {
    promptState?.resolve(value);
    setPromptState(null);
  }

  function handlePromptCancel() {
    promptState?.resolve(null);
    setPromptState(null);
  }

  return {
    confirmState,
    promptState,
    showConfirm,
    showPrompt,
    handleConfirmYes,
    handleConfirmNo,
    handlePromptConfirm,
    handlePromptCancel,
  };
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/admin/ui/ConfirmDialog.tsx components/admin/ui/PromptDialog.tsx hooks/useAdminDialogs.ts
git commit -m "feat(admin): add ConfirmDialog, PromptDialog, useAdminDialogs hook"
```

---

## Task 6: ReviewsAdminTable — window.confirm 교체

**Files:**
- Modify: `components/admin/ReviewsAdminTable.tsx`

**현재 코드 (56번 줄):**
```tsx
if (!window.confirm("이 리뷰를 영구 삭제할까요?")) return;
```

- [ ] **Step 1: import 추가 + 훅 연결**

파일 상단의 import 목록 다음에 추가:
```tsx
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
```

컴포넌트 함수 내부 최상단(첫 번째 useState 바로 아래)에 추가:
```tsx
const { confirmState, showConfirm, handleConfirmYes, handleConfirmNo } = useAdminDialogs();
```

- [ ] **Step 2: window.confirm 교체**

`deleteReview` 함수(또는 삭제 핸들러) 안의 window.confirm 줄을:
```tsx
if (!window.confirm("이 리뷰를 영구 삭제할까요?")) return;
```

다음으로 교체:
```tsx
const ok = await showConfirm({
  title: "리뷰 삭제",
  message: "이 리뷰를 영구 삭제할까요?",
  confirmLabel: "삭제",
  destructive: true,
});
if (!ok) return;
```

함수 선언에 `async` 추가 필요 시 추가.

- [ ] **Step 3: JSX 끝에 다이얼로그 렌더링 추가**

컴포넌트 return 문의 최상위 wrapper(div 또는 fragment) 안 마지막에 추가:
```tsx
{confirmState && (
  <ConfirmDialog
    open
    title={confirmState.title}
    message={confirmState.message}
    confirmLabel={confirmState.confirmLabel}
    cancelLabel={confirmState.cancelLabel}
    destructive={confirmState.destructive}
    onConfirm={handleConfirmYes}
    onCancel={handleConfirmNo}
  />
)}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공.

---

## Task 7: CustomOrdersAdminTable — window.confirm 교체

**Files:**
- Modify: `components/admin/CustomOrdersAdminTable.tsx`

**현재 코드 (167번 줄):**
```tsx
if (!window.confirm("이 의뢰를 영구 삭제할까요? 되돌릴 수 없습니다.")) return;
```

- [ ] **Step 1: import 추가**

```tsx
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
```

컴포넌트 함수 내부 최상단에:
```tsx
const { confirmState, showConfirm, handleConfirmYes, handleConfirmNo } = useAdminDialogs();
```

- [ ] **Step 2: window.confirm 교체**

167번 줄 근처 삭제 핸들러에서:
```tsx
// 변경 전
if (!window.confirm("이 의뢰를 영구 삭제할까요? 되돌릴 수 없습니다.")) return;

// 변경 후 (함수를 async로 변경 필요)
const ok = await showConfirm({
  title: "의뢰 삭제",
  message: "이 의뢰를 영구 삭제할까요?\n되돌릴 수 없습니다.",
  confirmLabel: "삭제",
  destructive: true,
});
if (!ok) return;
```

- [ ] **Step 3: JSX에 ConfirmDialog 추가**

컴포넌트 return 문의 최상위 wrapper 마지막에:
```tsx
{confirmState && (
  <ConfirmDialog
    open
    title={confirmState.title}
    message={confirmState.message}
    confirmLabel={confirmState.confirmLabel}
    cancelLabel={confirmState.cancelLabel}
    destructive={confirmState.destructive}
    onConfirm={handleConfirmYes}
    onCancel={handleConfirmNo}
  />
)}
```

---

## Task 8: UserDetailClient — window.confirm/prompt 전체 교체

**Files:**
- Modify: `components/admin/UserDetailClient.tsx`

**교체 대상 (7곳):**
- 67: `window.confirm(msg)` — 역할 변경 확인
- 79: `window.prompt("정지 사유:")` — 정지 사유 입력
- 117: `window.confirm("이 영상 접근 권한을 취소할까요?")` — 권한 취소 확인
- 136: `window.prompt(...)` — 삭제 이메일 확인 입력
- 150: `alert(...)` — 이메일 불일치
- 233: `window.confirm("휴면 처리하시겠습니까?")` — 휴면
- 241: `window.confirm("영구 차단하시겠습니까?")` — 영구 차단

- [ ] **Step 1: import 추가**

기존 import 블록 끝에:
```tsx
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import PromptDialog from "@/components/admin/ui/PromptDialog";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
```

- [ ] **Step 2: 훅 연결**

컴포넌트 함수 내부 첫 번째 useState 이후에:
```tsx
const {
  confirmState,
  promptState,
  showConfirm,
  showPrompt,
  handleConfirmYes,
  handleConfirmNo,
  handlePromptConfirm,
  handlePromptCancel,
} = useAdminDialogs();
```

- [ ] **Step 3: toggleRole (67번 줄) 교체**

```tsx
// 변경 전
if (!window.confirm(msg)) return;

// 변경 후 (toggleRole 함수를 async로 변경)
const ok = await showConfirm({ title: "역할 변경", message: msg });
if (!ok) return;
```

- [ ] **Step 4: handleSuspend (79번 줄) 교체**

```tsx
// 변경 전
async function handleSuspend() {
  const reason = window.prompt("정지 사유:");
  if (reason === null) return;
  await updateStatus("suspended", reason);
}

// 변경 후
async function handleSuspend() {
  const reason = await showPrompt({ title: "정지 사유 입력", message: "정지 사유를 입력하세요:" });
  if (reason === null) return;
  await updateStatus("suspended", reason);
}
```

- [ ] **Step 5: revokeGrant (117번 줄) 교체**

```tsx
// 변경 전
if (!window.confirm("이 영상 접근 권한을 취소할까요?")) return;

// 변경 후 (revokeGrant를 async로 변경)
const ok = await showConfirm({ title: "권한 취소", message: "이 영상 접근 권한을 취소할까요?", destructive: true });
if (!ok) return;
```

- [ ] **Step 6: deleteUser (136번 줄) 교체**

```tsx
// 변경 전
const confirmEmail = window.prompt(
  `⚠️ 회원을 완전히 삭제합니다.\n주문·포인트·쿠폰 등 모든 데이터가 삭제되며 복구 불가합니다.\n\n확인하려면 이메일 주소를 입력하세요:\n${email ?? profile.id}`
);
if (confirmEmail === null) return;
if (confirmEmail.trim() !== (email ?? profile.id)) {
  alert("이메일이 일치하지 않습니다. 삭제를 취소합니다.");
  return;
}

// 변경 후
const confirmEmail = await showPrompt({
  title: "⚠️ 회원 삭제",
  message: `회원을 완전히 삭제합니다.\n주문·포인트·쿠폰 등 모든 데이터가 삭제되며 복구 불가합니다.\n\n확인하려면 이메일 주소를 입력하세요:\n${email ?? profile.id}`,
  placeholder: email ?? profile.id,
  confirmLabel: "삭제",
  destructive: true,
});
if (confirmEmail === null) return;
if (confirmEmail.trim() !== (email ?? profile.id)) {
  await showConfirm({
    title: "삭제 취소",
    message: "이메일이 일치하지 않습니다. 삭제를 취소합니다.",
    confirmLabel: "확인",
    cancelLabel: "",
  });
  return;
}
```

- [ ] **Step 7: 휴면/차단 인라인 confirm 교체 (233, 241번 줄)**

JSX 내부 onClick에서:
```tsx
// 변경 전 (233번 줄)
onClick={() => { if (window.confirm("휴면 처리하시겠습니까?")) updateStatus("dormant"); }}

// 변경 후
onClick={async () => {
  const ok = await showConfirm({ title: "휴면 처리", message: "휴면 처리하시겠습니까?", destructive: true });
  if (ok) updateStatus("dormant");
}}

// 변경 전 (241번 줄)
onClick={() => { if (window.confirm("영구 차단하시겠습니까?")) updateStatus("banned"); }}

// 변경 후
onClick={async () => {
  const ok = await showConfirm({ title: "영구 차단", message: "영구 차단하시겠습니까?", destructive: true, confirmLabel: "차단" });
  if (ok) updateStatus("banned");
}}
```

- [ ] **Step 8: JSX에 두 다이얼로그 추가**

컴포넌트 return 최상위 wrapper 마지막에:
```tsx
{confirmState && (
  <ConfirmDialog
    open
    title={confirmState.title}
    message={confirmState.message}
    confirmLabel={confirmState.confirmLabel}
    cancelLabel={confirmState.cancelLabel}
    destructive={confirmState.destructive}
    onConfirm={handleConfirmYes}
    onCancel={handleConfirmNo}
  />
)}
{promptState && (
  <PromptDialog
    open
    title={promptState.title}
    message={promptState.message}
    placeholder={promptState.placeholder}
    confirmLabel={promptState.confirmLabel}
    cancelLabel={promptState.cancelLabel}
    destructive={promptState.destructive}
    onConfirm={handlePromptConfirm}
    onCancel={handlePromptCancel}
  />
)}
```

- [ ] **Step 9: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공.

---

## Task 9: UsersAdminTable — window.confirm/prompt 교체

**Files:**
- Modify: `components/admin/UsersAdminTable.tsx`

**교체 대상 (3곳):**
- 63: `window.prompt(...)` — 정지 사유 입력
- 243: `window.confirm(...)` — 휴면 처리
- 256: `window.confirm(...)` — 영구 차단

- [ ] **Step 1: import 추가**

```tsx
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import PromptDialog from "@/components/admin/ui/PromptDialog";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
```

컴포넌트 내부 훅 선언부에:
```tsx
const {
  confirmState,
  promptState,
  showConfirm,
  showPrompt,
  handleConfirmYes,
  handleConfirmNo,
  handlePromptConfirm,
  handlePromptCancel,
} = useAdminDialogs();
```

- [ ] **Step 2: 정지 사유 입력 교체 (63번 줄)**

정지 처리 함수를 찾아서:
```tsx
// 변경 전
const reason = window.prompt(`${user.email ?? user.display_name} 회원 정지 사유:`);
if (!reason) return;

// 변경 후 (함수를 async로)
const reason = await showPrompt({
  title: "정지 사유 입력",
  message: `${user.email ?? user.display_name} 회원 정지 사유를 입력하세요:`,
});
if (reason === null) return;
```

- [ ] **Step 3: 휴면/차단 confirm 교체 (243, 256번 줄)**

```tsx
// 변경 전 (243번 줄)
if (window.confirm(`${user.email} 회원을 휴면 처리할까요?`)) {

// 변경 후
const ok1 = await showConfirm({
  title: "휴면 처리",
  message: `${user.email} 회원을 휴면 처리할까요?`,
  destructive: true,
});
if (ok1) {

// 변경 전 (256번 줄)
if (window.confirm(`${user.email} 회원을 영구 차단할까요?`)) {

// 변경 후
const ok2 = await showConfirm({
  title: "영구 차단",
  message: `${user.email} 회원을 영구 차단할까요?`,
  confirmLabel: "차단",
  destructive: true,
});
if (ok2) {
```

- [ ] **Step 4: JSX에 다이얼로그 추가**

```tsx
{confirmState && (
  <ConfirmDialog
    open
    title={confirmState.title}
    message={confirmState.message}
    confirmLabel={confirmState.confirmLabel}
    cancelLabel={confirmState.cancelLabel}
    destructive={confirmState.destructive}
    onConfirm={handleConfirmYes}
    onCancel={handleConfirmNo}
  />
)}
{promptState && (
  <PromptDialog
    open
    title={promptState.title}
    message={promptState.message}
    placeholder={promptState.placeholder}
    confirmLabel={promptState.confirmLabel}
    cancelLabel={promptState.cancelLabel}
    destructive={promptState.destructive}
    onConfirm={handlePromptConfirm}
    onCancel={handlePromptCancel}
  />
)}
```

- [ ] **Step 5: 최종 빌드 + 커밋**

```bash
npm run build 2>&1 | tail -20
```

Expected: 성공.

```bash
git add components/admin/ReviewsAdminTable.tsx \
        components/admin/CustomOrdersAdminTable.tsx \
        components/admin/UserDetailClient.tsx \
        components/admin/UsersAdminTable.tsx
git commit -m "feat(admin): replace window.confirm/prompt with ConfirmDialog/PromptDialog modals"
```

---

## 완료 체크리스트

- [ ] `dangerouslySetInnerHTML` 제거됨 (TriggerCouponCard)
- [ ] Zod 설치됨, announcements 라우트 검증 적용
- [ ] ConfirmDialog, PromptDialog 컴포넌트 존재
- [ ] useAdminDialogs 훅 존재
- [ ] 4개 관리자 컴포넌트에서 window.confirm/prompt 0개
- [ ] `npm run build` 성공
- [ ] 어드민에서 삭제/정지/차단 동작이 모달로 표시됨
