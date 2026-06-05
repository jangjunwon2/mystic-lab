# Mystic Lab — 프로젝트 현황 (PROGRESS)

> 글로벌 마술사 전용 프리미엄 쇼핑몰 + 마술 기믹 앱(계산기·인스타). 이 문서는 **현재 상태/할 일** 요약본이다. (과거 세션별 로그는 정리·삭제함 — 이력은 git 커밋 히스토리 참고.)

## 개요
- **URL**: https://mystic-lab.vercel.app · **GitHub**: jangjunwon2/mystic-lab
- **Stack**: Next.js 16 (App Router) · Tailwind v4 · Supabase · LemonSqueezy/Toss · Cloudflare Stream/Vimeo · Resend
- **i18n**: en/ko/ja/zh-CN/es/fr/de (next-intl v4, `localePrefix: "always"`)
- **테마**: 퍼플 #7C3AED/#A855F7, 다크 배경 #0D0D1A

## 작업·배포 규칙 (단일 소스)
- **유일 작업/배포 폴더**: `C:\Users\jun92\Desktop\mystic-lab` (브랜치 `main` → Vercel 자동 배포)
- 홈(`C:\Users\jun92`)·옛 폴더에서 **git 금지**. 운영 브랜치는 `main` 하나.
- 테스트: 라이브(mystic-lab.vercel.app) 또는 이 폴더 `npm run dev`.

---

## ✅ 구현 완료 (현재 운영 중)

### 스토어 (고객)
- 홈 · 카테고리 쇼케이스(상품 등록된 카테고리만 동적) · 상품목록 필터/정렬 (7개 언어)
- 상품 상세: 리뷰, 데모영상(Cloudflare/YouTube), 재고, **구매 옵션=함께구매 애드온(다중선택, 할인율/정액)**, 공유(채널 트래킹), 위시리스트, **구매자 커뮤니티**(개선제안/연출공유/공지)
- 장바구니(**부분 선택 결제**) · 즉시구매 · 할인코드 · **마일리지 사용/적립**
- 결제: **LemonSqueezy**(해외 USD) / **Toss**(국내 KRW) — 서버 가격검증·멱등성·재고 CAS·실시간 환율
- 회원: 이메일 + Google OAuth(인앱브라우저 감지), 마이페이지(주문/튜토리얼/위시리스트/배송지/마일리지)
- 배송지 저장 · 국가선택(195개국) · 배송방법(EMS/Express +$15) · 주문 추적 링크
- 해법영상: 구매검증 후 **시청 전용 페이지**(Vimeo 임베드 / Cloudflare signed)
- 커스텀 의뢰 폼(회원정보 자동입력) · 법적 페이지(개인정보/약관/환불/배송, 7개 언어) · about/contact

### 어드민 (/admin · 한국어)
- 대시보드 · 통계(매출·전환율·위시→구매·공유·결제수단/국가 분포)
- 상품 CRUD(이미지 업로드·드래그정렬·Claude 자동번역·옵션 빌더·디지털 토글)
- 주문(상세·상태·**환불=게이트웨이 실환불+재고/포인트 복원**·배송추적·선택삭제)
- 배송 관리 전용 페이지 · 리뷰(게시 관리) · 커스텀의뢰 · 할인 · 영상 · 공지 · 뉴스레터
- 잠금코드(상품별 탭·기기바인딩 현황·강제해제·활성화 횟수제한·잠금·AES 암호화)
- 회원(트라이그램 검색·페이지네이션) · **증정/권한부여**(상품권한·무료주문·마일리지 지급)

### 결제·포인트 정합성
- 멱등성 가드(gateway key 중복 차단), 재고 낙관적 동시성(CAS+재시도), 유저 RPC 조회
- 포인트: **12개월 FIFO 만료**(로트 원장 + get/add/spend/expire RPC + 일일 cron), 환불 시 복원, **동시결제 과할인 차단**(포인트 hold/예약)
- 디지털 상품은 결제 즉시 `completed` → 구매 직후 리뷰 가능

### 마술 계산기 (PWA, `/calc`)
- 위장 계산기(iOS / 삼성 One UI) + 트릭: 포스(C 3초·고정값/시간), 피킹(9번 1초+좌스와이프 로그), 앞자리삭제(+/- 토글+좌스와이프), 결과복원, 페이크 인스타(`0000=`), BLE 감열 프린터(= 3초)
- **1코드=1기기 라이선싱**(active_token_hash·쿠키), 회원 자동발급, 코드 AES 암호화, 횟수제한/잠금
- 7개 언어 인앱 매뉴얼·비밀 설정창(좌상단 3초)
- 기획서: `마술_계산기_최종_기획_및_지침서.md` (코드 = 최신 업그레이드본 기준)

### 인스타 앱 (PWA, `/insta` · 독립 상품 `fake-instagram`)
- 피드/프로필/게시물상세/스토리/릴스/DM, 비밀설정(좌상단 3초)으로 콘텐츠 커스텀(기기내 localStorage 저장)
- 게시물 caption/date/댓글 **다국어**(LocalizedText) · 정확한 게시일 · 기기 뒤로가기 단계 복귀
- 라이선싱(상품별 `ml_dt_<id>` 쿠키), 회원 자동발급
- **iOS 대응**: apple-touch-icon(다크 배경 + 그라디언트 카메라, 제공 글리프 기반), 풀스크린(appleWebApp), 아래당김 검정 차단(html/body 스크롤 잠금), 뒤로가기 핫스팟 겹침 수정, overscroll-contain

### 공통
- 프론트 다국어화 사실상 완료(어드민·위장 UI 제외)
- 보안 점검 완료(서버 가격검증·멱등·rate limit·XSS·open redirect·입력검증·에러메시지 일반화)
- PWA: Android 서비스워커 / iOS는 SW 미사용(성능) · 실제 PNG 아이콘

---

## ⏳ 운영자(사장님) To-Do — 기능 활성화에 필요
- [x] ✅ **Supabase 마이그레이션 적용 완료** — `033_point_holds.sql` 실행 완료(동시결제 과할인 차단 활성). 019~032도 적용 완료
- [ ] **상품 등록 + 인증코드 발급**: slug `magic-calculator`, `fake-instagram` (없으면 `/calc`·`/insta` 게이트·자동발급 동작 안 함)
- [ ] **Vercel 환경변수**: `CRON_SECRET`(포인트 만료 cron), `ADMIN_EMAIL`, `RESEND_FROM_EMAIL`(문의 메일 수신)
- [ ] (선택) **Cloudflare Stream 실제 키** — 해법영상 자체 호스팅(현재 Vimeo 임베드로 대체 중)

---

## 🔜 앞으로 할 일 / 후보
- **인스타 앱 마술 기믹** — 관객 숫자/단어를 예언 게시물에 force 삽입, 관객 입력 peek, 검색 탭 위장 (현재는 '사실적 UI'까지)
- **인스타 사실성 잔여** — 릴스 캡션 다국어, 게시물 '원본 오디오' 라인, 프로필 하이라이트 스토리
- **계산기 인앱 매뉴얼 7개 언어 동기화** — 코드 기준(포스 마커=`.`버튼, 피킹 1초, 삭제 좌스와이프)으로. 기획서는 정정 완료, 인앱 `MANUAL_TEXTS`만 미반영
- **프린터 제어 독립 앱** — 계산기 내장 BLE 인쇄를 이미지·폰트 편집 가능한 별도 앱으로 분리
- **통계 대시보드 고도화** — 세그먼트·기간 필터·CSV 등
- **계산기 보완** — `eval()`→간이 파서, 설정창 PIN 잠금, NFC 매뉴얼 도메인 하드코딩 제거

---

## 🔍 점검 필요
- [ ] **인스타 앱 iOS 실기기 확인**(최신 배포 후): 홈 아이콘 · 풀스크린 · 아래당김 검정 · 뒤로가기 → 기존 홈추가본 **삭제 후 재추가** 필요(iOS 캐시)
- [ ] 라이브 **결제/포인트/리뷰/환불** 흐름 최종 확인
- [ ] 뉴스레터 HTML 미리보기 — 현재 `dangerouslySetInnerHTML` 직접 사용(어드민 자기입력, 저위험). sandboxed iframe 복원 여부 결정
- [ ] 프로젝트 폴더 내 **stray 디렉터리**(`componentsadmin`·`libcloudflare`·`publicimages`·`mystic-lab` 등, git 비추적) 정체 확인·정리

---

## 🔬 전체 코드 정밀 점검 — 영역별 액션 항목 (2026-06-05)

> 고위험 영역(인증·결제·입력·rate limit·에러노출) 중심 정밀 점검. **핵심 결론: 과거 progress가 "완료"로 적은 보안 수정 다수가 실제 코드에 없음(폴더 이동 중 유실 추정) → 재적용 필요.** 각 항목은 하나씩 해결 가능하도록 파일·라인·조치 방향 명시.

> **✅ 처리 결과 (2026-06-05)** — A·B·C·D(전체)·E·G(매뉴얼) + **어드민 error.message 18곳 일반화** + **업로드 매직바이트 검증** + **인스타 아이콘 밝기 보정** + **인스타 앱 내부 7개 언어 현지화** 모두 **수정·배포 완료**. `npx tsc` 통과. (커밋 7f20768·d61d163·8846c81·d721c44·f419abe)
> **남은 항목**: G-계산기 `eval()`(자기입력 한정·클라이언트·보안위험 없음 → 파서 교체는 계산기 회귀 위험 있어 보류), 설정창 PIN(**불필요 — 마술용, 관객 접근 불가**), I-`as any`(런타임 정상, 대규모 리팩터라 점진 개선), 인스타 앱 비밀설정 패널 현지화(운영자 전용이라 한국어 유지). **운영자: `033` 실행 완료.**

### 🔴 A. 인증/인가 (우선)
- [x] **`discounts/use` 인증 없음** ✅ (`app/api/discounts/use/route.ts`) — `codeId`만 받아 `increment_discount_used` RPC 호출. 비로그인 누구나 임의 코드의 사용횟수를 소진 가능(할인코드 griefing/무력화). → **로그인 검증 + codeId 유효성/실제 사용 연계** 필요. (과거 "인증 추가" 표기됐으나 유실)
- [x] **어드민 판별 이원화 + 금지 패턴 사용** ✅ — 미들웨어(`proxy.ts:36-44`)와 `app/api/admin/custom-orders/[id]/reply/route.ts:14-21`가 `profiles.role==="admin"`로 체크. 프로젝트 규칙상 **`profiles.role` 기반 체크 금지(RLS 재귀 버그)**이며 나머지 어드민 API는 전부 `requireAdmin()`(ADMIN_EMAIL). → **이메일 기반(`user.email===ADMIN_EMAIL`)으로 통일**. (011 RLS 미적용 시 어드민이 페이지 접근 못 하는 불일치 위험)

### 🟡 B. Rate limiting (대부분 유실)
- [x] ✅ (해결) 현재 `checkRateLimit` 적용은 **`admin/users/search`·`share/track`·`magic/verify-license`뿐**. 과거 "추가됨"이라던 아래에 rate limit 없음:
  - `discounts/validate` (코드 브루트포스), `newsletter/subscribe` (스팸), `custom-order` (**제출마다 어드민 메일 발송 → 메일 폭탄**), `reviews` (스팸). → IP 기준 rate limit 재적용.

### 🟡 C. 입력 검증
- [x] **`reviews` comment 길이 제한 없음** ✅ (`app/api/reviews/route.ts:60`) — 과거 "5000자 제한" 표기됐으나 코드에 없음. 거대 본문 저장 가능 → 길이 검증 추가.
- [ ] **업로드 MIME을 client `file.type`로만 검사** (`app/api/admin/products/upload/route.ts:19-22`) — 스푸핑 가능. 저위험(전용 버킷·랜덤 파일명·어드민 전용)이나 매직바이트 검증 권장.

### 🟡 D. 에러 메시지 노출 (광범위)
- [x] ✅ (사용자향 완료) 사용자향 라우트가 DB `error.message`를 그대로 반환 → 스키마/내부 노출. 일반 메시지로 교체:
  - `reviews:67`, `newsletter/subscribe:31`, `wishlist:30`, `account/profile:21`, `shipping-addresses:17,59`, `shipping-addresses/[id]:20,47`
  - 어드민 라우트 다수도 `error.message` 반환(저위험이나 정리 권장): announcements/discounts/referrals/videos/orders/products/users 등

### 🟡 E. 코드 ↔ 문서 드리프트 (메타)
- [x] ✅ (재적용 완료) 위 A~D + 뉴스레터 미리보기(`NewsletterClient.tsx` → sandboxed iframe으로 교체)는 모두 과거 progress에 "완료"로 적혔으나 실제 코드엔 없던 것 → **이번에 코드 기준으로 재적용.**

### 🟢 F. 결제 (이전 점검 유효 — 양호)
- 멱등성 가드·재고 CAS·포인트 FIFO 만료·동시결제 hold 적용 확인. 운영자: `033_point_holds.sql` 실행 시 과할인 차단 완전 활성.
- 외부 fetch는 전부 하드코딩 URL(LS/Toss/환율/CF) → SSRF 위험 낮음.

### 🟡 G. 마술 앱
- [x] ✅ (완료) 계산기 인앱 매뉴얼(`MagicCalculator.tsx` `MANUAL_TEXTS`, 7개 언어)을 코드 동작에 동기화(마커=`.`버튼/피킹 1초/삭제 좌스와이프). 기획서·매뉴얼 모두 코드와 일치.
- [ ] 계산기 `eval()` 사용(`MagicCalculator.tsx:321`, 자기입력 한정 저위험) → 간이 파서 권장. 설정창 PIN 없음. NFC 매뉴얼 도메인 하드코딩.
- [ ] 인스타 앱 **iOS 실기기 확인**(이번 배포): 아이콘·풀스크린·당김 검정·뒤로가기.

### 🟢 H. 미구현 / Mock (의도된 상태)
- PortOne 미구현(타입만, `lib/payments/toss.ts`·CLAUDE.md) — 건드리지 말 것.
- Cloudflare Stream 키 없으면 mock 폴백(`lib/cloudflare/stream.ts:19,45,83`) → 해법영상 자체호스팅 불가, 현재 Vimeo 임베드 대체.

### 🟢 I. 타입 안전성
- [ ] `createAdminClient() as any` 패턴 광범위(런타임 정상, 타입만 우회). DB 타입(`Database`) 정합화로 점진 개선 여지.

---

## 🔬 2차 정밀 점검 — 결제·웹훅·데이터접근 (2026-06-05)

### 🔴 새 발견 (우선)
- [ ] **lemon-confirm 주문 위조 가능** (`app/api/payment/lemon-confirm/route.ts`) — 성공페이지 폴백 엔드포인트가 **인증·결제검증 없이** 클라이언트가 보낸 items·email·totalUsd로 `saveOrderToSupabase`(status=paid)를 호출. LS 주문 조회는 환불용 id 확보 목적뿐이라 **금액/상태 미검증**(없으면 합성 ref로 신규 저장). → 공격자가 임의 주문을 '결제완료'로 만들어 **디지털 상품·해법영상·앱 코드를 무료 취득** 가능.
  - **안전한 수정안**: LS 키 설정 시 `lemonOrderId`로 LS 주문을 조회해 **status=paid + 금액 일치** 검증 후에만 저장, 검증 실패 시 저장하지 않음(웹훅이 백스톱이라 정상 주문 유실 없음). **결제 라이브 경로라 적용 전 확인 요망.**

### 🟢 기타
- [ ] **stripe-webhook 데드코드** (`app/api/stripe-webhook/route.ts`) — Stripe 미사용(Toss/Lemon만). 서명검증은 있으나 metadata의 클라이언트 가격을 신뢰. 미설정 시 503이라 현재 위험 없음 → 제거 권장(또는 활성화 시 서버 가격 재계산 필수).

### ✅ 점검 양호 (이상 없음)
- `lemon-webhook` 서명검증·환불 복원·멱등 / `toss-confirm` 서버 가격검증(5% 허용)·포인트 hold·확정 / `lemon-checkout` 서버 재계산·hold(에러 메시지도 일반화 완료) / `cron/expire-points` CRON_SECRET / `community` 구매검증·작성권한·길이제한 / `magic/my-code` 구매검증 / `account/points` 본인 한정 — 모두 적정.

---

## 📋 의도적 보류 / 운영자 항목 (현황)
- **Cloudflare Stream 실제 키** — 미발급(mock 모드). 해법영상 자체호스팅(서명 URL) 불가 → 현재 Vimeo 임베드로 대체. 키 발급 시 자체호스팅 전환 가능.
- **PortOne 결제** — 미구현(타입만 존재). KakaoPay·NaverPay 등 추가 시 필요.
- ~~계산기 `eval()` → 파서~~ — ✅ 완료(shunting-yard safeEval로 교체).
- **`as any` 타입 정합화** — 런타임 정상, Supabase+TS `never` 추론 우회용 의도적 코드. 대규모·고위험이라 보류(권장: 유지).
- ~~인스타·계산기 비밀설정 패널 현지화~~ — ✅ 완료(둘 다 7개 언어, 사용자=마술사용).
- **계산기 NFC 매뉴얼 도메인 하드코딩** — 커스텀 도메인 전환 시 수정.
- ~~stripe-webhook 제거~~ — ✅ 완료(데드코드 삭제).
- **Cloudflare Stream 대체(자체 호스팅)** — Supabase 서명 URL+`<video>`로 자체호스팅 가능(중간 난이도). 적용 여부 결정 대기.
- ~~설정창 PIN~~ — 불필요 확정(마술용, 관객 접근 불가).

---

## 환경변수
- **필수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`
- **결제**: `LEMON_SQUEEZY_API_KEY`/`STORE_ID`/`VARIANT_ID`/`WEBHOOK_SECRET`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
- **미디어/메일**: `CLOUDFLARE_ACCOUNT_ID`/`STREAM_TOKEN`/`STREAM_KEY_ID`/`STREAM_PRIVATE_KEY`(미설정 시 mock), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ANTHROPIC_API_KEY`(번역, claude-haiku-4-5)
- **기타**: `CRON_SECRET`(포인트 만료), `UNLOCK_CODE_SECRET`(미설정 시 서비스롤 파생), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`

## 개발 명령어
```bash
cd C:\Users\jun92\Desktop\mystic-lab
npm run dev                       # 로컬 테스트
git add [파일] && git commit -m "..." && git push origin main   # → Vercel 배포
```
