# Mystic Lab — 개발 진행 현황 (대화 컨텍스트 복원용)

> 이 파일은 대화 초기화 후 문맥 복원을 위한 문서입니다.
> 새 대화 시작 시 이 파일을 먼저 읽고 작업을 이어가세요.
> 마지막 업데이트: 2026-05-20

---

## 프로젝트 개요

- **프로젝트명**: Mystic Lab (미스틱랩)
- **목적**: 프로 마술사 대상 글로벌 프리미엄 쇼핑몰 ($80+ 상품)
- **운영 형태**: 1인 관리자
- **주력 시장**: 전세계 (미국/캐나다 우선), 국내 병행
- **월 운영 비용 목표**: $6~15/월 (초기)
- **경로**: `C:\Users\jun92\Desktop\클로드\mystic-lab\`

---

## 확정 기술 스택

| 분류 | 도구 | 비고 |
|------|------|------|
| 프레임워크 | **Next.js 16.2.6** (App Router) | `middleware.ts` → `proxy.ts`로 명칭 변경됨 |
| 스타일 | **Tailwind CSS v4** | `tailwind.config.ts` 없음, `@theme inline {}` 방식 |
| 애니메이션 | **Framer Motion** | |
| DB/Auth | **Supabase** | PostgreSQL + Auth + RLS |
| 호스팅 | **Vercel** | |
| CDN/DNS | **Cloudflare** | |
| 결제 (해외) | **Lemon Squeezy** | 모달 오버레이, 초기 비용 없음 |
| 결제 (국내) | **Toss Payments** | 위젯 내장, 테스트 모드 |
| 결제 (미래) | **PortOne** | 가입비 면제 목적, 코드 모듈화 준비 완료 |
| 영상 | **Cloudflare Stream** | |
| 이메일 | **Resend** | |
| 다국어 | **next-intl** | 7개 언어, `[locale]` 디렉토리 |
| 분석 | **Vercel Analytics + GA4** | |
| 마케팅 | **Meta Pixel** | |

---

## 환경변수 현황 (`.env.local`)

| 변수 | 상태 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 설정 완료 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 설정 완료 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 설정 완료 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ 테스트 키 (현재 미사용, Lemon으로 대체) |
| `STRIPE_SECRET_KEY` | ✅ 테스트 키 (현재 미사용) |
| `STRIPE_WEBHOOK_SECRET` | ⬜ 미설정 (미사용) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | ✅ 테스트 키 (`test_ck_docs_...`) |
| `TOSS_SECRET_KEY` | ✅ 테스트 키 (`test_sk_docs_...`) |
| `LEMON_SQUEEZY_API_KEY` | ✅ 설정 완료 |
| `LEMON_SQUEEZY_STORE_ID` | ✅ `380654` |
| `LEMON_SQUEEZY_VARIANT_ID` | ✅ `1675342` |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | ✅ 설정 완료 |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ 설정 완료 |
| `CLOUDFLARE_STREAM_TOKEN` | ✅ 설정 완료 |
| `CLOUDFLARE_STREAM_KEY_ID` | ⚠️ **Mock 값** — Cloudflare Stream 구독 후 실제 키 발급 필요 |
| `CLOUDFLARE_STREAM_PRIVATE_KEY` | ⚠️ **Mock 값** — Cloudflare Stream 구독 후 실제 키 발급 필요 |
| `RESEND_API_KEY` | ✅ 설정 완료 (`re_TAWZoEGC_...`) |
| `ADMIN_EMAIL` | ✅ `jun923008@gmail.com` |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⬜ 미설정 (코드 준비 완료) |
| `NEXT_PUBLIC_GA_ID` | ⬜ 미설정 (코드 준비 완료) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | ⚠️ 형식 오류 — `.env.local` 파일에서 수정 필요 (아래 주의사항 참조) |
| `PAYPAL_SECRET` | ✅ 설정 완료 (현재 미사용) |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ Vercel에서 `https://mystic-lab.vercel.app`으로 변경 필요 (현재 `http://localhost:3000`) |

---

## Supabase 정보

- **Project URL**: `https://ntrdztgrdiujkwcgpejv.supabase.co`
- **Project Ref**: `ntrdztgrdiujkwcgpejv`
- **마이그레이션 파일**: `supabase/migrations/001_initial_schema.sql`
- **마이그레이션 실행 상태**: ✅ **완료** (SQL Editor에서 직접 실행 성공)

### 생성된 테이블
- `profiles` — 유저 프로필, role: 'user' | 'admin'
- `products` — 상품 (slug, category, price_usd, stock, ...)
- `product_translations` — 다국어 상품 설명 (7개 언어)
- `solution_videos` — 해법 영상 (Cloudflare Stream ID)
- `product_unlock_codes` — 비회원 장비 잠금 해제 코드 (SHA-256 해시)
- `orders` — 주문 내역
- `order_items` — 주문 아이템
- `custom_order_requests` — 커스텀 도구 의뢰
- `reviews` — 상품 리뷰

### 핵심 RLS 정책
- `solution_videos`: 관리자 전체 접근 / 구매 회원 접근 / 비회원 차단
- `orders`: 본인 주문만 조회 / 관리자 전체
- 비회원 잠금 해제: service role key로만 접근 (API 라우트)

---

## 완료된 파일 목록

### 레이아웃 & 공통
- `app/layout.tsx` — Cinzel + Inter 폰트, 전역 레이아웃
- `app/globals.css` — Tailwind v4, 보라/골드 컬러 시스템
- `components/layout/Header.tsx` — 헤더 (장바구니 카운트, 언어 선택, localStorage 동기화)
- `components/layout/Footer.tsx` — 푸터
- `proxy.ts` — next-intl + auth 미들웨어 (Next.js 16 방식)
- `i18n/routing.ts`, `i18n/request.ts` — 7개 언어 설정
- `messages/en.json`, `messages/ko.json` — 영어/한국어 번역 완료

### 홈페이지
- `app/[locale]/page.tsx` — 홈 (4개 섹션)
- `components/home/HeroSection.tsx` — 히어로 (파티클 hydration 버그 수정 완료)
- `components/home/FeaturedProducts.tsx` — 추천 상품
- `components/home/CustomOrderBanner.tsx` — 커스텀 의뢰 배너
- `components/home/UnlockBanner.tsx` — 장비 잠금 해제 배너

### 상품
- `app/[locale]/products/page.tsx` — 상품 목록 (서버 컴포넌트)
- `components/products/ProductsClient.tsx` — 상품 목록 클라이언트 (카테고리 필터 제거됨, 정렬만)
- `app/[locale]/products/[slug]/page.tsx` — 상품 상세 (서버 컴포넌트, 3단계 영상 접근 제어)
- `components/products/ProductDetail.tsx` — 상품 상세 클라이언트
- `components/video/SolutionVideoSection.tsx` — 해법 영상 접근 제어 UI

### 인증
- `app/[locale]/sign-in/page.tsx` — 로그인 (이메일 + Google OAuth)
- `app/[locale]/sign-up/page.tsx` — 회원가입
- `app/api/auth/callback/route.ts` — OAuth 콜백

### 주요 기능 페이지
- `app/[locale]/cart/page.tsx` — 장바구니 (localStorage `ml_cart`)
- `app/[locale]/checkout/page.tsx` — **투트랙 결제 (International/국내)**
- `app/[locale]/checkout/success/page.tsx` — 결제 성공 (Toss 확인 처리 포함)
- `app/[locale]/unlock/page.tsx` — 비회원 장비 코드 입력
- `app/[locale]/custom-order/page.tsx` — 커스텀 의뢰 폼
- `app/[locale]/account/page.tsx` — 마이페이지 (서버)
- `components/account/AccountClient.tsx` — 마이페이지 클라이언트

### 결제 모듈 (핵심 아키텍처)
```
lib/payments/
  types.ts        — 공통 타입 (CartItem, OrderPayload, SaveOrderInput)
  save-order.ts   — Supabase 주문 저장 공통 함수
  lemon.ts        — Lemon Squeezy 서버 모듈 (checkout 생성, webhook 검증)
  toss.ts         — Toss Payments 서버 모듈 (confirmTossPayment, usdToKrw)
```

### API 라우트
- `app/api/auth/callback/route.ts` — Supabase OAuth
- `app/api/unlock/route.ts` — 비회원 장비 코드 검증 (SHA-256)
- `app/api/custom-order/route.ts` — 커스텀 의뢰 저장
- `app/api/checkout/route.ts` — Stripe Checkout (현재 미사용, 추후 참고용)
- `app/api/stripe-webhook/route.ts` — Stripe 웹훅 (현재 미사용)
- `app/api/payment/lemon-checkout/route.ts` — Lemon Squeezy 체크아웃 URL 생성
- `app/api/payment/lemon-webhook/route.ts` — Lemon Squeezy 웹훅 → Supabase 저장
- `app/api/payment/toss-confirm/route.ts` — Toss 결제 확인 → Supabase 저장

### 결제 컴포넌트
- `components/checkout/TossPaymentWidget.tsx` — 토스 결제 위젯 (동적 임포트)

### Supabase 클라이언트
- `lib/supabase/types.ts` — DB 타입 정의 (image_urls 필드 포함)
- `lib/supabase/client.ts` — 브라우저용
- `lib/supabase/server.ts` — 서버용 (createAdminClient 포함)

---

## 핵심 아키텍처 결정 사항

### 1. 투트랙 결제 시스템
```
International (해외):
  이메일 입력
  → POST /api/payment/lemon-checkout (서버에서 LS 세션 생성)
  → LemonSqueezy.Url.Open(url) — 모달 오버레이
  → postMessage("Checkout.Success") — 페이지 이동 없이 성공 처리
  → Lemon Squeezy 웹훅 → /api/payment/lemon-webhook → Supabase

국내 (Toss):
  이메일 입력
  → TossPaymentWidget 내장 (카드/계좌이체/간편결제)
  → requestPayment() → /checkout/success?gateway=toss (리다이렉트)
  → 성공 페이지에서 /api/payment/toss-confirm 호출 → Supabase
```

### 2. PortOne 전환 대비 모듈화
- `lib/payments/lemon.ts` → 추후 PortOne 어댑터로 교체 가능
- `lib/payments/toss.ts` → PortOne API로 래핑 가능
- `lib/payments/save-order.ts` → 두 게이트웨이 공통, 변경 불필요

### 3. 영상 접근 제어 (3단계)
```
관리자 (role='admin') → 전체 접근
구매 회원 → Supabase RLS: orders JOIN order_items 확인 → Cloudflare 서명 URL
비회원 + 장비 코드 → product_unlock_codes SHA-256 해시 매칭 → API 라우트 처리
```

### 4. 장바구니
- localStorage `ml_cart` 키에 JSON 배열 저장
- `{ id, slug, name, price_usd, quantity }` 형식
- 헤더에서 `storage` 이벤트로 크로스탭 동기화

### 5. 상품 카테고리
- DB에는 카테고리 필드 존재 (card_magic, coin_magic 등)
- **프론트엔드에서는 카테고리 필터 제거** — 상품 수가 적어 통합 노출
- 추후 상품 증가 시 다시 활성화 가능

### 6. Hydration 버그 수정 완료
- `HeroSection.tsx`의 `Particles` 컴포넌트: `Math.random()`을 `useEffect` 내부로 이동
- SSR/CSR 값 불일치 문제 해결

---

## 샘플 데이터 (DB에 삽입됨)

5개 상품:
- `phantom-deck` — $120 (카드 마술)
- `neural-link` — $340 (전자 멘탈리즘)
- `shadow-coin` — $95 (코인 마술)
- `mind-vault` — $185 (멘탈리즘)
- `prism-silk` — $220 (무대 마술)

코드에 하드코딩된 샘플 데이터도 동일하게 유지 (DB 미연결 시 폴백).

---

## 다음 작업 목록 (Next Steps) — 우선순위 순

### 🔴 즉시 필요 (결제 완성)
1. **Lemon Squeezy 계정 설정**
   - [app.lemonsqueezy.com](https://app.lemonsqueezy.com) 가입
   - 스토어 생성 → "Custom Price" 상품 1개 생성 (variant ID 복사)
   - API 키 발급 → `.env.local`에 입력:
     ```
     LEMON_SQUEEZY_API_KEY=...
     LEMON_SQUEEZY_STORE_ID=...
     LEMON_SQUEEZY_VARIANT_ID=...
     ```
   - Webhook URL: `https://[도메인]/api/payment/lemon-webhook`

2. **Toss Payments 실제 테스트**
   - 개발 서버 실행 후 국내 결제 탭에서 테스트
   - 테스트 카드: `4330-0000-0000-1000` / 임의 만료일 / CVC

### 🟡 핵심 기능 (다음 세션)
3. ~~**관리자 대시보드** (`app/admin/`)~~ ✅ **완료** (2025-05-19)
   - ✅ 대시보드 (`/admin`) — 매출·주문·상품·커스텀의뢰 통계
   - ✅ 상품 관리 (`/admin/products`) — CRUD, 활성/비활성 토글
   - ✅ 주문 관리 (`/admin/orders`) — 상태 변경, 아이템 상세 펼침
   - ✅ 커스텀 의뢰 관리 (`/admin/custom-orders`) — 상태 변경, 어드민 노트
   - ✅ 영상 관리 (`/admin/videos`) — Cloudflare Stream ID 연결
   - ✅ 잠금 해제 코드 발급 (`/admin/unlock-codes`) — SHA-256 해시, 평문 1회만 노출

4. **Cloudflare Stream 연동**
   - 서명된 URL 발급 API (`/api/stream-token`)
   - 영상 업로드 관리자 UI
   - `.env.local`에 `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_TOKEN` 입력

5. ~~**Resend 이메일 설정**~~ ✅ **완료** (2025-05-19)
   - ✅ `lib/resend/index.ts` — 이메일 발송 유틸리티 (HTML 템플릿 포함)
   - ✅ 주문 완료 이메일: lemon-webhook, toss-confirm 연동
   - ✅ 커스텀 의뢰 관리자 알림 이메일
   - ⬜ `.env.local`에 `RESEND_API_KEY`, `ADMIN_EMAIL` 입력 필요

### 🟢 완성도 향상
6. **실제 상품 이미지/썸네일 업로드**
   - Supabase Storage 또는 Cloudflare R2에 저장
   - `products.thumbnail_url`, `products.image_urls` 업데이트

7. ~~**나머지 5개 언어 번역**~~ ✅ **완료** (2025-05-19)
   - ✅ `messages/ja.json` — 일본어
   - ✅ `messages/zh-CN.json` — 중국어 간체
   - ✅ `messages/es.json` — 스페인어
   - ✅ `messages/fr.json` — 프랑스어
   - ✅ `messages/de.json` — 독일어

8. ~~**Meta Pixel + GA4 설치**~~ ✅ **완료** (2025-05-19)
   - ✅ `app/layout.tsx`에 GA4 + Meta Pixel Script 삽입
   - ✅ 결제 성공 페이지에서 `purchase` 이벤트 발송
   - ⬜ `.env.local`에 `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` 입력 필요

9. ~~**Vercel 배포 + Cloudflare DNS 연결**~~ ✅ **완료** (2026-05-20)
   - ✅ GitHub: `jangjunwon2/mystic-lab` (`master` 및 `main` 브랜치 동일 코드)
   - ✅ Vercel 배포: `https://mystic-lab.vercel.app` 정상 작동
   - ✅ 환경변수 등록 완료 (Production & Preview)
   - ✅ Lemon Squeezy 웹훅 등록: `/api/payment/lemon-webhook`
   - ✅ Framework Preset: "Next.js"로 설정 (초기 "Other"로 되어 있어 404 발생했었음)
   - ✅ Supabase Site URL: `https://mystic-lab.vercel.app` 설정 완료
   - ✅ Supabase Redirect URL: `https://mystic-lab.vercel.app/api/auth/callback` 등록
   - ⬜ `NEXT_PUBLIC_SITE_URL` Vercel 환경변수를 `https://mystic-lab.vercel.app`으로 변경 후 Redeploy
   - ⬜ 커스텀 도메인 연결 (선택)

10. **Supabase 인증 설정** ✅ **이메일 인증 완료** (2026-05-20)
    - ✅ **이메일 인증**: Supabase 자체 이메일(기본 SMTP)로 변경 → 인증 성공
      - Resend SMTP 설정은 제거, Supabase 기본 메일러 사용 중
    - ✅ **Google OAuth**: Supabase Providers에서 Client ID/Secret 입력 완료
    - ✅ **회원 이름 "Member" 고정 표시 버그 수정** (2026-05-20)
      - `app/[locale]/account/page.tsx`: `profiles.display_name` null 시 `user_metadata.full_name` → `email` 순서로 fallback + DB 백필
    - ✅ **솔루션 영상 섹션 로그인 버튼 노출 버그 수정** (2026-05-20)
      - `app/[locale]/products/[slug]/page.tsx`: auth 체크를 상품 DB 조회와 분리 → DB 오류 시에도 로그인 상태 정확히 반영
      - `components/video/SolutionVideoSection.tsx`: 로그인+미구매(Case 3) UI에 "Enter Device Code" 버튼 추가

### 🔵 미래 기능
11. **PortOne 연동** (PG사 가입비 면제 목적)
    - `lib/payments/lemon.ts` 또는 `lib/payments/toss.ts`를 PortOne 어댑터로 교체
    - `lib/payments/save-order.ts`는 변경 없음

---

## 관리자 대시보드 — 기능 상세 명세

> 1인 운영자 기준, 글로벌 프리미엄 마술 쇼핑몰에 필요한 관리 기능 전체 목록.
> Vanishing Inc, Theory11, Gumroad 등 유사 플랫폼 벤치마킹 및 디지털 상품 플랫폼 best practice 반영.
> 우선순위: 🔴 필수(즉시) → 🟡 중요(다음 단계) → 🟢 선택(장기)

---

### A. 회원 관리 (User Management)

#### 🔴 필수
- **회원 목록**: 가입일, 이메일, 이름, 역할(user/admin), 마지막 로그인, 총 구매액 표시
- **회원 검색/필터**: 이메일, 이름, 역할, 가입일 범위로 검색
- **회원 상세 페이지**:
  - 기본 정보 (이메일, 이름, 가입일, 로그인 방법)
  - 구매 내역 전체 (주문 ID, 상품, 금액, 날짜)
  - 보유 영상 접근 권한 목록
- **회원 강퇴/정지**: `profiles.status` 필드 추가 → `active | suspended | banned`
  - suspended: 로그인 가능, 구매/영상 접근 차단
  - banned: 로그인 자체 차단 (Supabase Auth에서 disable)
  - 정지 사유 메모 저장
- **강퇴 해제**: 상태 복원

#### 🟡 중요
- **영상 접근 권한 수동 부여/회수**:
  - 관리자가 특정 회원에게 특정 상품의 해법 영상 접근 권한을 직접 부여
  - DB 테이블: `manual_video_grants (id, user_id, product_id, granted_by, note, expires_at)`
  - 용도: 환불 후 영상만 유지 허용, 리뷰어/마술사 협업, CS 보상
  - 만료일 설정 가능 (무기한 or 특정 날짜)
- **회원 이메일 발송**: 개별 회원에게 관리자 메모 또는 공지 이메일 (Resend 연동)
- **회원 CSV 내보내기**: 이메일 마케팅 도구 연동용

#### 🟢 선택
- **회원 메모**: 관리자 전용 내부 메모 (회원에게 비공개)
- **로그인 이력**: 마지막 5회 로그인 IP/시간 (보안 모니터링)

---

### B. 영상 관리 (Video Management)

#### 🔴 필수
- **영상 목록**: 상품 연결 여부, Cloudflare Stream ID, 업로드 날짜
- **영상 업로드**: Cloudflare Stream Direct Upload → Stream ID 자동 저장
- **상품-영상 연결/해제**: `solution_videos` 테이블 관리
- **잠금 해제 코드 관리**:
  - 코드 발급 (상품 선택 → 자동 생성, 평문 1회 노출)
  - 코드 목록 (해시만 표시, 사용 여부, 사용 날짜)
  - 코드 무효화 (used_at을 강제로 설정하거나 별도 `is_revoked` 필드)

#### 🟡 중요
- **영상 시청 통계** (장기 — Cloudflare Analytics 연동):
  - 상품별 총 시청 수
  - 회원별 시청 여부
  - 평균 시청 완료율

---

### C. 상품 관리 (Product Management)

#### 🔴 필수 (현재 구현됨 ✅)
- 상품 CRUD, 활성/비활성 토글, 재고 관리

#### 🟡 중요
- **노출 순서 편집**: 홈 추천 상품, 목록 페이지 정렬 순서를 드래그앤드롭으로 변경
  - DB: `products.display_order INTEGER` 필드 추가
- **할인/쿠폰 코드**:
  - 테이블: `discount_codes (id, code, type: percent|fixed, value, max_uses, used_count, expires_at, is_active)`
  - 결제 시 코드 입력 → 서버에서 검증 → 금액 차감
  - 관리자 대시보드에서 생성/비활성화
- **번들 상품**: 여러 상품을 묶어 할인 판매 (장기)
- **상품 이미지 업로드**: Supabase Storage or Cloudflare R2에 직접 업로드 UI

#### 🟢 선택
- **재고 부족 알림**: 재고 N개 이하 시 관리자 이메일 알림

---

### D. 주문 관리 (Order Management)

#### 🔴 필수 (현재 구현됨 ✅)
- 주문 목록, 상태 변경, 아이템 상세

#### 🟡 중요
- **환불 처리**:
  - Lemon Squeezy: 대시보드에서 직접 처리 (API 연동 or 수동)
  - Toss: 환불 API 호출 → `orders.status = 'refunded'`
  - 환불 후 영상 접근 자동 차단 (또는 수동 유지 옵션)
- **주문 수동 생성**: 오프라인/직접 판매 시 관리자가 수동으로 주문 생성
  - 특정 회원 + 상품 선택 → 주문 레코드 삽입 → 영상 접근 자동 부여
- **주문 CSV 내보내기**: 세금 신고, 회계 처리용

#### 🟢 선택
- **배송 정보 입력**: 실물 상품인 경우 운송장 번호 입력 → 회원 이메일 자동 발송

---

### E. 리뷰 관리 (Review Management)

#### 🔴 필수
- **리뷰 목록**: 상품명, 작성자, 별점, 내용, 작성일, 승인 여부
- **승인/비승인**: 기본 비승인 상태로 저장, 관리자 승인 후 노출 (`is_approved`)
- **리뷰 삭제**: 스팸, 악성, 관련 없는 리뷰 즉시 삭제
- **필터**: 미승인 리뷰만 보기, 별점별 필터

#### 🟡 중요
- **리뷰 신고 시스템**: 회원이 부적절 리뷰 신고 → 관리자 검토 큐에 올라옴
  - DB: `review_reports (id, review_id, reported_by, reason, created_at)`
- **구매 확인 표시**: 구매 이력 있는 회원의 리뷰에 "Verified Purchase" 뱃지 자동 부여

---

### F. 분석/통계 (Analytics & Reporting)

#### 🔴 필수
- **매출 대시보드**:
  - 오늘 / 이번 주 / 이번 달 / 전체 매출 (USD)
  - 기간 비교 (전월 대비 증감률)
  - 일별 매출 그래프 (Recharts)
- **상품별 판매 순위**: 판매 수량, 매출액 기준 정렬
- **주문 건수 추이**

#### 🟡 중요
- **전환율 (Conversion Rate)**:
  - 상품 페이지 뷰 → 장바구니 추가 → 구매 완료 퍼널
  - 구현 방법: `page_events` 테이블에 뷰/장바구니 이벤트 기록, 또는 Vercel Analytics + GA4 데이터 활용
- **국가별 매출 분포**: 주문의 `customer_email` 도메인 또는 Stripe/Lemon 지역 데이터 활용
- **회원 유형별 분석**: 신규 vs 재구매 비율
- **인기 검색어 / 카테고리 클릭 분포** (장기)

#### 🟢 선택
- **LTV (고객 생애 가치)**: 회원별 총 구매액 순위
- **이탈 분석**: 장바구니 추가 후 미결제 회원 수 추적

---

### G. 커스텀 의뢰 관리 (Custom Order Management)

#### 🔴 필수 (현재 구현됨 ✅)
- 의뢰 목록, 상태 변경 (검토중/견적발송/진행중/완료), 어드민 노트

#### 🟡 중요
- **의뢰별 이메일 회신**: 대시보드에서 바로 고객에게 답변 이메일 발송 (Resend)
- **파일 첨부 보기**: 의뢰 시 업로드한 참고 이미지 미리보기

---

### H. 마케팅 / 공지 (Marketing & Announcements)

#### 🟡 중요
- **사이트 공지 배너**: 홈 상단에 표시할 공지 텍스트 관리 (할인, 이벤트 등)
  - DB: `announcements (id, message, is_active, starts_at, ends_at)`
- **이메일 뉴스레터**: 전체 회원 또는 구매자에게 일괄 이메일 발송 (Resend)
  - 세그먼트: 전체 회원 / 특정 상품 구매자 / 최근 미접속 회원

#### 🟢 선택
- **제휴/레퍼럴 코드**: 마술사 유튜버 등과 협업 시 추적 코드 발급

---

### I. DB 추가 필드 요약 (구현 시 필요)

| 테이블 | 추가 필드 | 용도 |
|--------|----------|------|
| `profiles` | `status TEXT DEFAULT 'active'` | 강퇴/정지 상태 |
| `profiles` | `suspension_reason TEXT` | 정지 사유 |
| `products` | `display_order INTEGER` | 노출 순서 |
| `reviews` | `is_reported BOOLEAN` | 신고 여부 |
| (신규) `manual_video_grants` | `user_id, product_id, granted_by, note, expires_at` | 수동 영상 권한 |
| (신규) `discount_codes` | `code, type, value, max_uses, used_count, expires_at` | 할인 코드 |
| (신규) `review_reports` | `review_id, reported_by, reason` | 리뷰 신고 |
| (신규) `announcements` | `message, is_active, starts_at, ends_at` | 사이트 공지 |

---

### J. 구현 우선순위 로드맵

```
Phase 1 (완료 ✅ 2026-05-20): 
  - ✅ 회원 강퇴/정지/복원 (/admin/users)
  - ✅ 영상 접근 수동 부여/회수 (/admin/users/[id])
  - ✅ 리뷰 승인/삭제 (/admin/reviews)
  - ✅ 수동 주문 생성 (/admin/orders/new)

  DB 마이그레이션: supabase/migrations/002_phase1_admin.sql
  → Supabase SQL Editor에서 실행 필요

Phase 2 (완료 ✅ 2026-05-20):
  - ✅ 매출 상세 통계 (/admin/analytics) — SVG 30일 바차트, KPI, 상품 랭킹, 상태별 분포
  - ✅ 할인/쿠폰 코드 (/admin/discounts) — 퍼센트/금액 할인, 만료일, 최대사용횟수
  - ✅ 체크아웃 쿠폰 입력 UI + 할인 자동 적용 (LS/Toss 모두)
  - ✅ 환불 처리 (/api/admin/orders/[id]/refund) — Toss는 취소 API 호출, LS는 DB 업데이트 + 참조 ID 표시
  - ✅ 주문 목록 환불 버튼 추가 (OrdersAdminTable)
  - ✅ 공지 배너 (/admin/announcements) — 사이트 상단 노출, dismiss 가능, 날짜 범위 설정

  DB 마이그레이션: supabase/migrations/003_phase2_admin.sql
  → Supabase SQL Editor에서 실행 필요 (discount_codes, announcements 테이블 + increment function)

Phase 3 (장기):
  - 이메일 뉴스레터
  - 제휴 레퍼럴 코드
  - 영상 시청 통계 (Cloudflare Analytics)
  - 재고 부족 알림
```

---

## 주의사항 / 알려진 이슈

1. **TypeScript `any` 캐스팅**: Supabase 클라이언트가 일부 쿼리에서 `never` 타입을 반환하는 이슈 → `(supabase as any)` 임시 처리. 추후 타입 개선 필요.

2. **PayPal 환경변수 형식 오류**: `.env.local` 46번째 줄에 `NEXT_PUBLIC_PAYPAL_CLIENT_ID=` 다음 줄에 `Af8-oYnrDSxFPwH1xHj6p...`가 별도 줄로 작성되어 있어 파싱 오류 발생 가능. 아래와 같이 한 줄로 수정 필요:
   ```
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=Af8-oYnrDSxFPwH1xHj6p...실제전체값
   ```
   (현재 PayPal 결제는 미구현 상태이므로 당장 문제없음)

3. **Cloudflare Stream 서명 URL**: `CLOUDFLARE_STREAM_KEY_ID`와 `CLOUDFLARE_STREAM_PRIVATE_KEY`가 Mock 값이므로 서명된 URL 발급 불가 → 현재는 비서명 직접 URL로 폴백. Cloudflare Stream 구독 후 실제 키로 교체하면 즉시 활성화됨.

2. **Toss 위젯 환율**: `lib/payments/toss.ts`의 `USD_TO_KRW = 1380` 하드코딩 → 추후 실시간 환율 API로 교체 권장.

3. **Stripe 코드 존재**: `app/api/checkout/route.ts`, `app/api/stripe-webhook/route.ts` 파일이 남아있음 (미사용). 정리하거나 유지 가능.

4. ~~**번역 파일 불완전**~~: 7개 언어 모두 완료됨 (en, ko, ja, zh-CN, es, fr, de).

5. **샘플 데이터**: 상품 상세 페이지는 Supabase 연결 실패 시 하드코딩 샘플 데이터로 폴백. DB에 실제 데이터가 있으면 자동으로 DB 데이터 사용.

---

## 배포 관련 중요 정보

### GitHub 레포 구조
- **레포**: `jangjunwon2/mystic-lab`
- **production 브랜치**: `master` (Vercel이 추적)
- **main 브랜치**: master와 동일 코드 (둘 다 최신)
- **주의**: 원본 경로(`Desktop/클로드/mystic-lab`)에 한글이 있어 직접 push 불가
- **배포 전용 복사본**: `C:\Users\jun92\Desktop\ml-deploy\` — 여기서 git push 해야 함

### 코드 수정 후 배포 방법
```powershell
# 1. 원본에서 ml-deploy로 변경된 파일 복사
Copy-Item -Path "C:\Users\jun92\Desktop\클로드\mystic-lab\변경된파일" -Destination "C:\Users\jun92\Desktop\ml-deploy\변경된파일"

# 2. ml-deploy에서 커밋 & 푸시
cd C:\Users\jun92\Desktop\ml-deploy
git add .
git commit -m "fix: 변경 내용"
git push origin main
git push origin main:master
```

### Vercel 트러블슈팅 이력
- **404 원인 1**: GitHub 레포에 한글 경로(`Desktop/클로드/mystic-lab`)가 Root Directory로 설정됨 → ASCII 경로의 `ml-deploy`로 해결
- **404 원인 2**: Vercel Framework Preset이 "Other"로 설정됨 → "Next.js"로 변경해 해결
- **next.config.ts**: `createNextIntlPlugin('./i18n/request.ts')` 명시적 경로 추가됨

### 라이브 URL
- **프로덕션**: `https://mystic-lab.vercel.app`
- **Supabase**: `https://ntrdztgrdiujkwcgpejv.supabase.co`

---

## 개발 서버 실행

```bash
cd "C:\Users\jun92\Desktop\클로드\mystic-lab"
npm run dev
# → http://localhost:3000
```

포트 충돌 시:
```powershell
Stop-Process -Id [PID] -Force
```

---

## 테스트 체크리스트

- [ ] 홈페이지 정상 로딩 (`/en`)
- [ ] 상품 목록 페이지 (`/en/products`)
- [ ] 상품 상세 페이지 (`/en/products/phantom-deck`)
- [ ] 장바구니 추가 → `/en/cart`
- [ ] 결제 페이지 International 탭 → Lemon Squeezy (키 설정 후)
- [ ] 결제 페이지 국내 탭 → Toss 위젯 렌더링
- [ ] 비회원 잠금 해제 (`/en/unlock`)
- [ ] 커스텀 의뢰 폼 (`/en/custom-order`)
- [ ] 회원가입/로그인 (`/en/sign-up`, `/en/sign-in`)
- [ ] 마이페이지 (`/en/account`)
