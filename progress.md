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
