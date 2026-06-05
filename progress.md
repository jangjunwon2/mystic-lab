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
- [ ] **Supabase 마이그레이션 적용 확인** — 특히 `033_point_holds.sql`(미실행 시 동시결제 과할인 차단 비활성, 기존 동작 폴백). 그 외 019~032는 적용 완료로 확인됨
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

### 🔴 A. 인증/인가 (우선)
- [ ] **`discounts/use` 인증 없음** (`app/api/discounts/use/route.ts`) — `codeId`만 받아 `increment_discount_used` RPC 호출. 비로그인 누구나 임의 코드의 사용횟수를 소진 가능(할인코드 griefing/무력화). → **로그인 검증 + codeId 유효성/실제 사용 연계** 필요. (과거 "인증 추가" 표기됐으나 유실)
- [ ] **어드민 판별 이원화 + 금지 패턴 사용** — 미들웨어(`proxy.ts:36-44`)와 `app/api/admin/custom-orders/[id]/reply/route.ts:14-21`가 `profiles.role==="admin"`로 체크. 프로젝트 규칙상 **`profiles.role` 기반 체크 금지(RLS 재귀 버그)**이며 나머지 어드민 API는 전부 `requireAdmin()`(ADMIN_EMAIL). → **이메일 기반(`user.email===ADMIN_EMAIL`)으로 통일**. (011 RLS 미적용 시 어드민이 페이지 접근 못 하는 불일치 위험)

### 🟡 B. Rate limiting (대부분 유실)
- [ ] 현재 `checkRateLimit` 적용은 **`admin/users/search`·`share/track`·`magic/verify-license`뿐**. 과거 "추가됨"이라던 아래에 rate limit 없음:
  - `discounts/validate` (코드 브루트포스), `newsletter/subscribe` (스팸), `custom-order` (**제출마다 어드민 메일 발송 → 메일 폭탄**), `reviews` (스팸). → IP 기준 rate limit 재적용.

### 🟡 C. 입력 검증
- [ ] **`reviews` comment 길이 제한 없음** (`app/api/reviews/route.ts:60`) — 과거 "5000자 제한" 표기됐으나 코드에 없음. 거대 본문 저장 가능 → 길이 검증 추가.
- [ ] **업로드 MIME을 client `file.type`로만 검사** (`app/api/admin/products/upload/route.ts:19-22`) — 스푸핑 가능. 저위험(전용 버킷·랜덤 파일명·어드민 전용)이나 매직바이트 검증 권장.

### 🟡 D. 에러 메시지 노출 (광범위)
- [ ] 사용자향 라우트가 DB `error.message`를 그대로 반환 → 스키마/내부 노출. 일반 메시지로 교체:
  - `reviews:67`, `newsletter/subscribe:31`, `wishlist:30`, `account/profile:21`, `shipping-addresses:17,59`, `shipping-addresses/[id]:20,47`
  - 어드민 라우트 다수도 `error.message` 반환(저위험이나 정리 권장): announcements/discounts/referrals/videos/orders/products/users 등

### 🟡 E. 코드 ↔ 문서 드리프트 (메타)
- [ ] 위 A~D + 뉴스레터 미리보기(`NewsletterClient.tsx:173` `dangerouslySetInnerHTML`)는 모두 과거 progress에 "완료"로 적혔으나 실제 코드엔 없음. → **"완료" 표기 신뢰 말고 코드 기준으로 재점검·재적용.**

### 🟢 F. 결제 (이전 점검 유효 — 양호)
- 멱등성 가드·재고 CAS·포인트 FIFO 만료·동시결제 hold 적용 확인. 운영자: `033_point_holds.sql` 실행 시 과할인 차단 완전 활성.
- 외부 fetch는 전부 하드코딩 URL(LS/Toss/환율/CF) → SSRF 위험 낮음.

### 🟡 G. 마술 앱
- [ ] 계산기 인앱 매뉴얼(`MagicCalculator.tsx` `MANUAL_TEXTS`, 7개 언어)이 코드 동작과 불일치(마커=`.`버튼/피킹 1초/삭제 좌스와이프). 기획서는 정정 완료, 매뉴얼만 미반영.
- [ ] 계산기 `eval()` 사용(`MagicCalculator.tsx:321`, 자기입력 한정 저위험) → 간이 파서 권장. 설정창 PIN 없음. NFC 매뉴얼 도메인 하드코딩.
- [ ] 인스타 앱 **iOS 실기기 확인**(이번 배포): 아이콘·풀스크린·당김 검정·뒤로가기.

### 🟢 H. 미구현 / Mock (의도된 상태)
- PortOne 미구현(타입만, `lib/payments/toss.ts`·CLAUDE.md) — 건드리지 말 것.
- Cloudflare Stream 키 없으면 mock 폴백(`lib/cloudflare/stream.ts:19,45,83`) → 해법영상 자체호스팅 불가, 현재 Vimeo 임베드 대체.

### 🟢 I. 타입 안전성
- [ ] `createAdminClient() as any` 패턴 광범위(런타임 정상, 타입만 우회). DB 타입(`Database`) 정합화로 점진 개선 여지.

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
