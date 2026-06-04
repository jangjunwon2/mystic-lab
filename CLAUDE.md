@AGENTS.md
@progress.md

---

# Mystic Lab — Coding Rules

## 1. Think Before Coding

- **가정을 명시적으로 드러내라.** 불확실하면 구현 전에 물어봐라.
- **더 단순한 방법이 있으면 먼저 제안하라.** 구현 전에 push-back 해도 된다.
- **모호하면 멈추고 명확히 해라.** 무언가가 불명확할 때 그냥 추측해서 진행하지 마라.

## 2. 최소한의 코드

- 요청된 것만 구현한다. 그 이상은 금지.
- 단일 사용 코드에 추상화 레이어를 추가하지 마라.
- "유연성"이나 "확장성"을 미리 넣지 마라 — 실제로 필요할 때 추가해라.
- 200줄로 쓸 수 있는 걸 50줄에 쓸 수 있다면 다시 써라.

## 3. Surgical Changes

- 요청된 것만 수정한다. 인접한 코드, 주석, 포맷팅을 "개선"하지 마라.
- 기존 스타일을 그대로 따른다 — 다르게 하고 싶어도.
- 내 변경으로 생긴 orphan(미사용 import, 변수)만 제거한다.
- **모든 변경된 줄은 사용자의 요청으로 직접 추적 가능해야 한다.**

---

## Next.js 16 패턴

### 미들웨어 구조
```
middleware.ts   ← Next.js 진입점. proxy.ts를 re-export만 함
proxy.ts        ← 실제 미들웨어 로직 + config export
```
절대 `middleware.ts`에 로직을 직접 쓰지 마라.

### params는 항상 await
```ts
// Server Component
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
}

// Client Component
useEffect(() => {
  params.then(({ locale: l }) => setLocale(l));
}, [params]);
```

### Server vs Client 컴포넌트 선택
- **Server**: 데이터 페칭, DB 접근, SEO가 필요한 페이지 → `getTranslations`, `createClient()`
- **Client**: 인터랙션이 있는 UI, useState/useEffect 필요 → `"use client"`, `useTranslations`
- 정적 콘텐츠 페이지(법적 페이지 등)는 Server Component로 작성한다.

---

## Tailwind CSS v4

**`tailwind.config.ts` 파일이 없다.** 절대 생성하지 마라.

디자인 토큰은 `app/globals.css`의 `@theme inline {}` 블록에서 정의한다:
```css
@theme inline {
  --color-primary: #7C3AED;
}
```

---

## Supabase 클라이언트 — 4가지, 혼용 금지

| 함수 | 키 | 언제 |
|---|---|---|
| `createClient()` from `@/lib/supabase/server` | anon | 서버 컴포넌트, 일반 API route |
| `createAdminClient()` from `@/lib/supabase/server` | service role | 어드민 API DB 쿼리 (RLS 우회) |
| `createClient()` from `@supabase/supabase-js` with service role | service role | **Storage 업로드 전용** |
| `createBrowserClient()` | anon | 클라이언트 컴포넌트 |

Storage 업로드는 반드시 `@supabase/supabase-js`의 `createClient`에 서비스 롤 키를 직접 넘겨야 한다.

---

## 어드민 인증

**DB 쿼리 없이 이메일만으로 체크한다.**

```ts
// lib/admin-auth.ts
import { requireAdmin } from "@/lib/admin-auth";
// 모든 어드민 API route에서 이 함수를 먼저 호출
```

`profiles.role` 컬럼 기반 체크를 추가하지 마라 — RLS 재귀 참조 버그가 있다.

---

## i18n (next-intl v4)

- 지원 로케일: `en`, `ko`, `ja`, `zh-CN`, `es`, `fr`, `de` (7개)
- `localePrefix: "always"` — URL은 항상 `/en/...` 형태
- 새 번역 키 추가 시 **7개 언어 파일 모두** 수정
- 서버: `getTranslations()` / 클라이언트: `useTranslations()`
- 긴 정적 텍스트(법적 페이지 등)는 JSON에 넣지 않고 컴포넌트에 locale-keyed 객체로 인라인

---

## 디자인 시스템

```
배경: #0D0D1A (페이지), #1A1A2E (카드), #13131F (입력창)
테두리: #2D2D4E
기본 텍스트: #F0E6FF
보조 텍스트: #9CA3AF, #6B7280
메인 퍼플: #7C3AED (solid), #A855F7 (hover/accent)
헤더 폰트: var(--font-cinzel), serif
```

새 UI를 만들 때 위 토큰을 사용하지 않으면 안 된다.

---

## 파일 배치 / 배포 규칙 (단일 소스)

```
C:\Users\jun92\Desktop\mystic-lab\   ← 유일한 작업·배포 폴더. 모든 수정·커밋·푸시 여기서만!
                                       (→ Vercel `main` 자동 배포 / GitHub: jangjunwon2/mystic-lab)
```

> ⚠️ **폴더명 주의**: 이 폴더는 한때 `ml-deploy`였고, 바탕화면에서 `mystic-lab`로 이름 변경 예정/완료.
> 만약 폴더가 아직 `Desktop\ml-deploy`라면 그게 바로 이 폴더다(이름만 다름, 내용·git·배포 동일).
> 이름을 바꿔도 git 원격·커밋 이력·Vercel 배포에는 전혀 지장 없다. **항상 "바탕화면의 mystic-lab(구 ml-deploy) 폴더"를 작업 폴더로 간주한다.**

- **모든 작업(수정·`git add`·`commit`·`push`)은 이 폴더 안에서만, 브랜치는 `main`.**
  ```
  cd C:\Users\jun92\Desktop\mystic-lab     # (아직 안 바꿨으면 ml-deploy)
  npm run dev                              # 로컬 테스트
  git add [수정한 파일]
  git commit -m "..."
  git push origin main                     # → Vercel 운영 배포
  ```
- **테스트는 라이브(mystic-lab.vercel.app) 또는 이 폴더의 `npm run dev`에서만 한다.** 다른 폴더의 옛 사본에서 테스트하지 말 것.
- **❌ `C:\Users\jun92`(홈)에서는 절대 `git`/`git push` 금지.** 홈은 더 이상 git 저장소가 아니며(.git 제거됨), 거기서 push하면 폐기된 `master` 브랜치가 되살아난다.
- GitHub 운영 브랜치는 **`main` 하나뿐**이다 (`master`는 폐기·삭제됨).
- 옛 개발 폴더 `Desktop\클로드\mystic-lab\`는 **삭제됨**. 모든 내용은 이 폴더로 일원화됨.

---

## 상품 카테고리

현재 운영 중: `card_magic`, `stage_magic` (2개만)
다른 카테고리 값을 코드에 하드코딩하지 마라.

## 데모 영상 컬럼 (`demo_video_cloudflare_id`)

- Cloudflare Stream: UUID 그대로 저장
- YouTube: `yt:VIDEO_ID` 형식 (예: `yt:dQw4w9WgXcQ`)
- 렌더링 시 `yt:` 접두사 감지 후 YouTube embed URL로 변환

## 썸네일 URL

Google Drive 공유 링크 붙여넣으면 자동 변환:
`drive.google.com/file/d/ID/view` → `drive.google.com/uc?export=view&id=ID`

---

## 결제 플로우

| 게이트웨이 | 상태 | 대상 |
|---|---|---|
| LemonSqueezy | ✅ | 해외 (USD) |
| Toss Payments | ✅ | 한국 (KRW) |
| PortOne | ❌ 미구현 | 타입만 존재 — 건드리지 마라 |

`lib/payments/toss.ts`의 `USD_TO_KRW = 1380`은 하드코딩된 환율이다 — 수정 전 주의.

---

## 알려진 버그 / 주의사항

- **`as any` 남용**: `createAdminClient()` 체이닝 시 TypeScript가 `never` 추론 → 런타임은 정상, 타입만 문제
- **RLS 재귀 참조**: `supabase/migrations/011_rls_fix_and_dormant.sql`을 Supabase에서 실행하지 않으면 홈페이지 상품 미표시
- **로컬 빌드**: Turbopack CSS 파싱 버그로 FATAL 에러 가능 — Vercel 빌드는 정상
