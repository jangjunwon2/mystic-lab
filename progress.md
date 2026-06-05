# Mystic Lab — 프로젝트 현황 (PROGRESS)

> 글로벌 마술사 전용 프리미엄 쇼핑몰 + 마술 기믹 앱(계산기·인스타). 이 문서는 **현재 상태/할 일** 요약본이다. (세부 이력은 git 커밋 히스토리 참고.)

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
- 장바구니(**부분 선택 결제**) · 즉시구매 · **할인·레퍼럴 코드**(공용 입력창) · **마일리지 사용/적립**
- 결제: **LemonSqueezy**(해외 USD) / **Toss**(국내 KRW) — 서버 가격검증·멱등성·재고 CAS·실시간 환율
- 회원: 이메일 + Google OAuth(인앱브라우저 감지), 마이페이지(주문/튜토리얼/위시리스트/배송지/마일리지)
- 배송지 저장 · 국가선택(195개국) · 배송방법(EMS/Express +$15) · 주문 추적 링크
- 해법영상: 구매검증 후 **시청 전용 페이지**(Vimeo 임베드 / Cloudflare signed)
- 커스텀 의뢰 폼(회원정보 자동입력) · 법적 페이지(개인정보/약관/환불/배송, 7개 언어) · about/contact

### 어드민 (/admin · 한국어)
- 대시보드 · 통계(매출·전환율·위시→구매·공유·결제수단/국가 분포·**고객 세그먼트(빈도·구매액대별 매출 기여)**·**기간 지정 CSV 내보내기**)
- 상품 CRUD(이미지 업로드·드래그정렬·Claude 자동번역·옵션 빌더·디지털 토글)
- 주문(상세·상태·**환불=게이트웨이 실환불+재고/포인트 복원**·배송추적·선택삭제)
- 배송 관리 전용 페이지 · 리뷰(게시 관리) · 커스텀의뢰 · 할인 · 영상 · 공지 · 뉴스레터
- **레퍼럴/제휴 코드**(파트너용 코드 생성·관리 — 코드/추천인/할인율 · 사용횟수 집계) — 고객 체크아웃 **할인코드 입력창 공용**으로 적용(검증·정률 할인·주문 귀속·사용횟수 서버측 증가)
- 잠금코드(상품별 탭·기기바인딩 현황·강제해제·활성화 횟수제한·잠금·AES 암호화)
- 회원(트라이그램 검색·페이지네이션) · **증정/권한부여**(상품권한·무료주문·마일리지 지급)

### 결제·포인트 정합성
- 멱등성 가드(gateway key 중복 차단), 재고 낙관적 동시성(CAS+재시도), 유저 RPC 조회
- 포인트: **12개월 FIFO 만료**(로트 원장 + get/add/spend/expire RPC + 일일 cron), 환불 시 복원, **동시결제 과할인 차단**(포인트 hold/예약)
- 포인트 정책: **가입 환영 적립 ~$2(200P, 1회·멱등)**, **적립 사용 최소 보유 $5(500P) 하한**(미만 시 사용 불가, 서버 검증), **적립률 어드민 가변 설정**(`/admin/settings`, `site_settings` 테이블 · 기본 5%)
- 디지털 상품은 결제 즉시 `completed` → 구매 직후 리뷰 가능

### 마술 계산기 (PWA, `/calc`)
- 위장 계산기(iOS / 삼성 One UI) + 트릭: 포스(C 3초·고정값/시간), 피킹(9번 1초+좌스와이프 로그), 앞자리삭제(+/- 토글+좌스와이프), 결과복원, 페이크 인스타(`0000=`), BLE 감열 프린터(= 3초)
- 사칙연산은 **안전 파서(safeEval)** 로 처리(eval 미사용)
- **1코드=1기기 라이선싱**(active_token_hash·쿠키), 회원 자동발급, 코드 AES 암호화, 횟수제한/잠금
- **7개 언어**: 인앱 매뉴얼 + **비밀 설정창**(좌상단 3초, 라벨·프린터 상태 메시지까지)
- 기획서: `마술_계산기_최종_기획_및_지침서.md` (코드 = 최신 업그레이드본 기준)

### 인스타 앱 (PWA, `/insta` · 독립 상품 `fake-instagram`)
- 피드/프로필/게시물상세/스토리/릴스/DM + **프로필 하이라이트 스토리**(원형 커버 행), 비밀설정(좌상단 3초)으로 콘텐츠 커스텀(기기내 localStorage 저장)
- **7개 언어**: 게시물 caption/date/댓글 + **릴스 캡션** + **하이라이트 제목**(LocalizedText) + 좋아요 문구·빈 상태·DM 라벨 + **비밀 설정창 전체**. 정확한 게시일·기기 뒤로가기 단계 복귀
- **게시물 음원(♪) 라인**(사용자명 아래 "Original audio" 등) — 사실성 강화
- **피드 자연스러움**: 다른 계정 게시물(`feedPosts`, 작성자별 username/verified)을 본인 게시물과 번갈아 노출(프로필 그리드엔 본인 것만) · DM 보강 · **이니셜+그라데이션 아바타**(빈 아바타를 계정별 다른 색 원으로 — 자산 없이 구분) · 설정창에 피드 게시물 관리 섹션
- 라이선싱(상품별 `ml_dt_<id>` 쿠키), 회원 자동발급
- **iOS 대응**: apple-touch-icon(다크 배경 + 밝은 그라디언트 카메라, 제공 글리프 기반), 풀스크린(appleWebApp), 아래당김 검정 차단(html/body 스크롤 잠금), 뒤로가기 핫스팟 겹침 수정, overscroll-contain

### 공통
- 프론트 다국어화 사실상 완료(어드민·언어선택 옵션명 제외)
- PWA: Android 서비스워커 / iOS는 SW 미사용(성능) · 실제 PNG 아이콘
- **줄바꿈 타이포그래피**: 제목 `text-wrap: balance`, 본문 `pretty`, 한국어/CJK `word-break: keep-all`(어색한 줄바꿈 개선)
- **보안 헤더**: HSTS·X-Content-Type-Options·X-Frame-Options·Referrer-Policy·Permissions-Policy 강제 + **CSP는 Report-Only**(라이브 콘솔 위반 0 확인 후 강제 승격 예정)
- **테스트**: vitest 단위 테스트 도입(`npm test`) — 포인트 적립·옵션 할인가·인스타 표시 로직(21 케이스). safeEval 추출 테스트는 후속

---

## 🔒 보안·품질 점검 완료 내역 (2026-06-05)

> 전체 코드 2차 정밀 점검 후, 과거 progress가 "완료"로 적었으나 폴더 이동 중 유실됐던 보안 수정들을 **코드 기준으로 재적용** + 신규 발견 수정. 모두 `npx tsc` 통과·배포 완료.

- **인증**: `discounts/use` 로그인 검증 추가(코드 소진 방지). 어드민 판별을 **이메일 기준(`requireAdmin`)으로 통일** — 미들웨어·`custom-orders/reply`의 금지패턴(`profiles.role`) 제거
- **결제 위조 차단**: `lemon-confirm`(성공페이지 폴백)이 **실제 LS 결제(paid) 확인 후에만** 주문 저장 — 미확인 시 웹훅에 위임. 무료 취득 취약점 제거
- **Rate limit**: `discounts/validate`·`newsletter/subscribe`·`custom-order`·`reviews` 추가
- **입력 검증**: `reviews` 댓글 5000자 제한, 업로드 **매직바이트(이미지 시그니처) 검증**
- **에러 노출 제거**: 사용자향 + 어드민 라우트 18곳의 DB `error.message`를 일반 메시지로 교체
- **XSS**: 뉴스레터 미리보기를 sandboxed iframe으로 교체
- **데드코드**: 미사용 `stripe-webhook` 삭제
- **점검 양호(이상 없음)**: `lemon-webhook`(서명검증·환불복원·멱등) / `toss-confirm`(서버 가격검증·포인트 hold) / `lemon-checkout`(서버 재계산) / `cron/expire-points`(CRON_SECRET) / `community`(구매검증·권한) / `magic/my-code`·`account/points`(본인 한정) / 외부 fetch 전부 하드코딩 URL(SSRF 낮음)
- **정리**: 홈 디렉터리 stale 프로젝트 파일 삭제, 프로젝트 내 mangled junk 디렉터리 제거, progress.md·CLAUDE.md 프로젝트로 일원화

---

## ⏳ 운영자(사장님) To-Do
- [x] **Supabase 마이그레이션** — `033_point_holds.sql` 포함 019~033 적용 완료
- [ ] **Supabase 마이그레이션 `034_site_settings.sql`** 실행 — 포인트 적립률 어드민 설정용(미실행 시 기본 5% 동작, 어드민 저장은 안 됨)
- [ ] **상품 등록 + 인증코드 발급**: slug `magic-calculator`, `fake-instagram` (없으면 `/calc`·`/insta` 게이트·자동발급 동작 안 함)
- [ ] **Vercel 환경변수 확인**: `CRON_SECRET`(포인트 만료 cron), `ADMIN_EMAIL`, `RESEND_FROM_EMAIL`(문의 메일 수신)

---

## 🔍 점검 필요 (실기기/라이브)
- [ ] **인스타·계산기 앱 iOS 실기기 확인**(최신 배포 후): 홈 아이콘 · 풀스크린 · 아래당김 검정 · 뒤로가기 → 기존 홈추가본 **삭제 후 재추가**(iOS 캐시)
- [ ] 라이브 **결제/포인트/리뷰/환불** 흐름 최종 확인

---

## 🔜 앞으로 할 일 / 후보
- **인스타 앱 마술 기믹** — 관객 숫자/단어를 예언 게시물에 force 삽입, 관객 입력 peek, 검색 탭 위장 (현재는 '사실적 UI'까지)
- **프린터 제어 독립 앱** — 계산기 내장 BLE 인쇄를 이미지·폰트 편집 가능한 별도 앱으로 분리

---

## 📋 의도적 보류 / 결정 대기
- **Cloudflare Stream 대체(영상 자체 호스팅)** — **Supabase 서명 URL + `<video>`** 로 자체호스팅 가능(중간 난이도). 장점: 외부 서비스 불필요·구매자 한정 유지 / 단점: 적응형 화질 없음·전송비용·복제방지 약함. **적용 여부 결정 대기**(현재 Vimeo 임베드로 대체 중)
- **PortOne 결제** — 미구현(타입만). KakaoPay·NaverPay 등 추가 시 필요. 건드리지 말 것
- **`as any` 타입 정합화** — Supabase+TS `never` 추론 우회용 **의도적 코드**(런타임 정상). 대규모·고위험·런타임 이득 0 → **유지 권장**
- **계산기 NFC 매뉴얼 도메인 하드코딩**(`mystic-lab.vercel.app`) — 커스텀 도메인 전환 시 수정

---

## 환경변수
- **필수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`
- **결제**: `LEMON_SQUEEZY_API_KEY`/`STORE_ID`/`VARIANT_ID`/`WEBHOOK_SECRET`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
- **미디어/메일**: `CLOUDFLARE_ACCOUNT_ID`/`STREAM_TOKEN`/`STREAM_KEY_ID`/`STREAM_PRIVATE_KEY`(미설정 시 mock), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ANTHROPIC_API_KEY`(번역, claude-haiku-4-5)
- **기타**: `CRON_SECRET`(포인트 만료), `UNLOCK_CODE_SECRET`(미설정 시 서비스롤 파생), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`
- **선택(Rate limit)**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — 설정 시 글로벌 rate limit(Upstash Redis), 미설정 시 in-memory 폴백(서버리스 인스턴스별 분리)

## 개발 명령어
```bash
cd C:\Users\jun92\Desktop\mystic-lab
npm run dev                       # 로컬 테스트
git add [파일] && git commit -m "..." && git push origin main   # → Vercel 배포
```
