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
- 상품 상세: 리뷰, 데모영상(Cloudflare/YouTube), 재고, **구매 옵션=함께구매 애드온(다중선택, 할인율/정액)**, **공유(버튼→팝업에서 앱 선택·인스타그램 포함·채널 트래킹)**, 위시리스트, **구매자 커뮤니티**(개선제안/연출공유/공지)
- 장바구니(**부분 선택 결제**) · 즉시구매 · **할인·레퍼럴·개인 쿠폰**(공용 입력창) · **마일리지 사용/적립** · **체크아웃 쿠폰 드롭다운**(보유 개인쿠폰 + 적용가능 활성 공개쿠폰, 최소주문·상품한정 미충족분은 비활성, **코드 대신 쿠폰 이름 표시**)
- **위시리스트 정기 쿠폰 C3** ✅ (#2-C3): 위시리스트 **N일+ 잔존 상품** → 해당 회원에게 **그 상품 한정 개인 쿠폰** 자동 발급(`source='trigger'`, 멱등 — 같은 회원·상품 활성 쿠폰 있으면 skip) + 이메일. 일 1회 cron `/api/cron/wishlist-coupons`(CRON_SECRET, `vercel.json` 스케줄 `0 19 * * *`). 설정 `/admin/coupons`의 **위시리스트 정기 쿠폰 카드**(enabled/일수/할인율/유효개월/이름, `site_settings`, **기본 OFF**). 새 마이그레이션·테이블 불필요. ⚠️ 장바구니 트리거는 서버 장바구니 동기화 선행(미구현)
- **쿠폰 이름·삭제/정지** ✅: 쿠폰에 `name`(명목, 어드민 입력) — 고객 드롭다운·적용칩·요약에 코드 대신 이름. 어드민 `/admin/coupons` 목록에서 **임의 삭제**(`DELETE`, FK CASCADE) + **정지/재개**(`is_active` 토글, `PATCH`); 정지 쿠폰은 validate·드롭다운에서 제외(개인·공개 공통). ⚠️ **`043_coupon_name.sql`** 필요
- 결제: **LemonSqueezy**(해외 USD) / **Toss**(국내 KRW) — 서버 가격검증·멱등성·재고 CAS·실시간 환율
- 회원: 이메일 + Google OAuth(인앱브라우저 감지), 마이페이지(주문/튜토리얼/위시리스트/배송지/마일리지) · **주문내역에서 웹앱(계산기·인스타) 열기**(앱 상품마다 코드+실행)
- 배송지 저장 · 국가선택(195개국) · 배송방법(EMS/Express +$15) · 주문 추적 링크
- 해법영상: 구매검증 후 **시청 전용 페이지**(Vimeo 임베드 / Cloudflare signed)
- 커스텀 의뢰 폼(회원정보 자동입력) · 법적 페이지(개인정보/약관/환불/배송, 7개 언어) · **법적고지(`/legal-notice`)**: 한국 사업자정보(전자상거래법)·일본 特商法 표기·독일 Impressum·EU 14일 청약철회를 로케일별 표준 형식으로(사업자명 비에이블·사업자번호 기입, 나머지 자리표시자) · about/contact

### 어드민 (/admin · 한국어)
- 대시보드 · 통계(매출·전환율·위시→구매·공유·결제수단/국가 분포·**고객 세그먼트(빈도·구매액대별 매출 기여)**·**기간 지정 CSV 내보내기**)
- 상품 CRUD(이미지 업로드·드래그정렬·Claude 자동번역·옵션 빌더·디지털 토글)
- 주문(상세·상태·**환불=게이트웨이 실환불+재고/포인트 복원**·배송추적·선택삭제)
- 배송 관리 전용 페이지 · 리뷰(게시 관리) · 커스텀의뢰 · 할인 · 영상 · 공지(**프로모션 쿠폰코드** 표시) · 뉴스레터 · **구매자 커뮤니티 관리**(`/admin/community` — 전 상품 글/댓글 조회·삭제·필터)
- **쿠폰 발급**(`/admin/coupons`): 회원/이메일에 1회용 개인 쿠폰(정률/정액) 수동 발급 + 자동발급분(뉴스레터·레퍼럴) 조회. **뉴스레터 구독 시 환영 쿠폰 자동발급**(설정 `newsletter_coupon_percent`)
- **레퍼럴/제휴 코드**: 신규 구매자 할인 **정률/정액 선택** + **추천인 보상 쿠폰 자동발급**(구매 시 이메일→회원 매칭) · 고객 체크아웃 공용 입력창 적용 · 사용횟수 서버측 집계
- 잠금코드(상품별 탭·기기바인딩 현황·강제해제·활성화 횟수제한·잠금·AES 암호화)
- 회원(트라이그램 검색·페이지네이션) · **증정/권한부여**(상품권한·무료주문·마일리지 지급)

### 결제·포인트 정합성
- 멱등성 가드(gateway key 중복 차단 + `23505` 충돌 시 기존 주문 id 멱등 반환), 재고 낙관적 동시성(CAS+재시도), 유저 RPC 조회
- **주문↔회원 연결**: 체크아웃에서 로그인 `user_id`를 캡처해 결제 경로(lemon-checkout→pending_checkouts→webhook / confirm·toss-confirm 세션)로 전달 → save-order가 **user_id 우선** 사용. 게이트웨이 결제 이메일이 계정과 달라도 본인 주문에 연결(없으면 이메일 역추적 폴백)
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
- **계산기↔인스타 예언 연동**: 계산기가 관객 피킹/포스값을 `ml_calc_instagram_prediction`에 지속 저장 → 인스타 앱이 읽어 게시물 캡션의 `{force}`/`{num1}`/`{num2}`/`{result}` 토큰 치환(기본 '마지막에서 한개 이전' 게시물에 `{force}` 배치). 앱 재포커스 시 갱신
- 라이선싱(상품별 `ml_dt_<id>` 쿠키), 회원 자동발급
- **iOS 대응**: apple-touch-icon(다크 배경 + 밝은 그라디언트 카메라, 제공 글리프 기반), 풀스크린(appleWebApp), 아래당김 검정 차단(html/body 스크롤 잠금), 뒤로가기 핫스팟 겹침 수정, overscroll-contain

### 공통
- 프론트 다국어화 사실상 완료(어드민·언어선택 옵션명 제외)
- PWA: Android 서비스워커 / iOS는 SW 미사용(성능) · 실제 PNG 아이콘
- **줄바꿈 타이포그래피**: 제목 `text-wrap: balance`, 본문 `pretty`, 한국어/CJK `word-break: keep-all`(어색한 줄바꿈 개선)
- **보안 헤더**: HSTS·X-Content-Type-Options·X-Frame-Options·Referrer-Policy·Permissions-Policy 강제 + **CSP는 Report-Only**(라이브 콘솔 위반 0 확인 후 강제 승격 예정)
- **테스트**: vitest 단위 테스트 도입(`npm test`) — 포인트 적립·옵션 할인가·인스타 표시 로직(21 케이스). safeEval 추출 테스트는 후속
- **Rate limit**: `lib/rate-limit` — Upstash Redis(환경변수 설정 시 글로벌 슬라이딩 윈도우) / 미설정·장애 시 in-memory 폴백. 적용: discounts/validate·newsletter·custom-order·reviews·share/track·users/search
- **공지 배너 수정**: 고정 헤더에 가려 X가 안 닫히던 문제 — 배너 `fixed z-[60]` + `--ml-banner-h`로 헤더·본문 오프셋

---

## 🔒 보안·품질 점검 (2026-06-05 완료, 재확인 불필요)

> 전체 코드 2차 점검·배포 완료. 적용: 어드민 판별 **이메일 기준(`requireAdmin`) 통일**(`profiles.role` 제거) · **결제 위조 차단**(`lemon-confirm` paid 검증 후 저장) · Rate limit 확대 · 입력검증(리뷰 5000자·업로드 매직바이트) · DB `error.message` 노출 제거(18곳) · 뉴스레터 XSS(sandboxed iframe) · 데드코드 제거. 점검 양호: `lemon-webhook`·`toss-confirm`·`lemon-checkout`·`cron/expire-points`·`community`·`account/points`. (상세는 git 이력)

---

## ⏳ 운영자(사장님) To-Do
> 마이그레이션 **019~035 적용 완료** (포인트 hold·site_settings·쿠폰/레퍼럴 등) — 재확인 불필요.

- [ ] **Supabase 마이그레이션 `036_pending_checkouts.sql`** — ⚠️ **해외결제 항목 5개+ 처리에 필수**. 미적용 시 압축 폴백(4개까지만). LS custom 255자 제한 우회용 대기 장바구니 테이블
- [ ] **Supabase 마이그레이션 `039_order_price_breakdown.sql`** — 주문 상세 가격 분해 컬럼(미적용 시 신규주문 분해 미기록). `038_drop_discount_codes.sql`은 선택(미사용 테이블 정리)
- [ ] **Supabase 마이그레이션 `040_coupon_period.sql`** — 쿠폰 사용 시작일(starts_at). 프로모션(기간한정) 공개쿠폰용
- [ ] **Supabase 마이그레이션 `041_coupon_per_user_limit.sql`** — 쿠폰 1인당 사용 한도(per_user_limit) + 사용이력 테이블(coupon_redemptions)
- [ ] **Supabase 마이그레이션 `042_coupon_targeting.sql`** — 쿠폰 상품/카테고리 한정 조인테이블(coupon_products·coupon_categories)
- [ ] **Supabase 마이그레이션 `043_coupon_name.sql`** — 쿠폰 이름(명목) 컬럼. 고객 드롭다운에 코드 대신 이름 노출
- [ ] **Supabase 마이그레이션 `037_unify_coupons.sql`** — 쿠폰 통합 Phase 0. `issued_coupons`에 공개쿠폰(scope/max_uses/used_count) 추가 + `discount_codes` 백필 + `redeem_public_coupon` RPC. ⚠️ 미적용 시 어드민 공개쿠폰 발급/검증 동작 안 함(레거시 `discount_codes`는 폴백으로 계속 동작). **후방호환**: `discount_codes`·`/admin/discounts`는 보존(추후 cleanup에서 폐기)
- [ ] **법적고지 `/legal-notice` 자리표시자 기입** — 대표자명·사업장 주소·연락처·통신판매업 신고번호(+EU 판매 시 VAT). ⚠️ 모든 법률 문구는 템플릿이며 **변호사/법률 서비스 검토 후** 적용 권장
- [ ] **상품 등록 + 인증코드 발급**: slug `magic-calculator`, `fake-instagram` (없으면 `/calc`·`/insta` 게이트·자동발급 동작 안 함)
- [ ] **Vercel 환경변수 확인**: `CRON_SECRET`(포인트 만료 cron), `ADMIN_EMAIL`, `RESEND_FROM_EMAIL`(문의 메일 수신)

---

## 🔍 점검 필요 (실기기/라이브)
- [ ] **인스타·계산기 앱 iOS 실기기 확인**(최신 배포 후): 홈 아이콘 · 풀스크린 · 아래당김 검정 · 뒤로가기 → 기존 홈추가본 **삭제 후 재추가**(iOS 캐시)
- [ ] 라이브 **국내(Toss) 결제·환불·리뷰** 확인 (해외 LemonSqueezy 결제 ✅ 확인 완료)
- [ ] **쿠폰/레퍼럴 라이브 확인**: 뉴스레터 환영 쿠폰 발급 → 체크아웃 사용, 레퍼럴 신규자 할인(정률/정액) + 추천인 보상 쿠폰 발급, 어드민 쿠폰 수동 발급
- [ ] **포인트 정책 확인**: 가입 보너스 200P 지급, $5 미만 사용 차단, 어드민 적립률 변경 반영
- [ ] **계산기↔인스타 force 실기기 확인**: 계산기 입력 후 인스타 앱 '마지막에서 한개 이전' 게시물에 숫자 노출
- [ ] **공지 배너** X 닫힘 + **공유 팝업/인스타그램** 동작 확인

---

## 🔜 앞으로 할 일 / 후보
- **인스타 앱 마술 기믹 잔여** — 숫자 force 삽입(계산기 연동)은 완료. 남은 것: 관객 *단어* 예언, 인스타 자체 입력 peek, 검색 탭 위장
- **프린터 제어 독립 앱** — 계산기 내장 BLE 인쇄를 이미지·폰트 편집 가능한 별도 앱으로 분리

---

## 📐 기획(확정) — 쿠폰 통합 + 프로모션 엔진 (미구현, 착수 대기)

> 목표: ① 첫 가입/기간한정 **자동 쿠폰**, ② **이벤트 일괄 발급**, ③ **프로모션 현황 대시보드**, ④ **할인코드↔쿠폰 통일**. 코드는 아직 안 짬 — 아래는 합의된 설계.

### 결정 사항
1. 가입 환영쿠폰 기본값 **10% / 6개월**(어드민에서 가변)
2. 대량 이메일은 **배치·throttle로 정식 구현**(회원 많아져도 동작)
3. 자동발급 트리거는 **가입(signup)만** v1, '주문 시'는 추후 확장
4. 쿠폰 코드 형태는 **현행 `ML-XXXX` 단순 유지**(소스별 접두어 X)
5. **`discount_codes`(공개·다회) + `issued_coupons`(개인·1회)를 단일 "쿠폰" 모델로 통일.** `referral_codes`는 의미가 달라(추천인 보상) **별개 유지**
6. 자동/일괄 발급 쿠폰 노출: **마이페이지 "내 쿠폰" 탭 + 발급 이메일**(둘 다)

### 통합 모델 (마이그레이션 `037_*.sql`, 운영자 1회 실행)
- **`issued_coupons` 확장 → 통합 쿠폰**: `scope('personal'|'public')` + 공개형용 `max_uses`/`used_count` 추가
  - 개인형: 소유자(user_id/email) 한정·1회(`is_used`) — 현행 유지
  - 공개형: 소유자 없음·다회(`used_count < max_uses`) — `discount_codes` 대체
- **`discount_codes` 데이터 이관** → `issued_coupons(scope='public')`, 이후 `/admin/discounts`·`discount_codes` 폐기
- **`promotions`**(자동발급 규칙: trigger='signup', type/value/min/만료, starts_at·ends_at(null=상시), is_active) — 종료일 없으면 상시 가입쿠폰, 있으면 기간한정(2기능 통합)
- **`promotion_grants`**(promotion_id·user_id·issued_coupon_id, UNIQUE(promo,user)) — 회원별 중복발급 방지
- `issued_coupons(source)` 인덱스(대시보드 집계용)

### 대상(이벤트 일괄발급) — 가능/보류
- ✅ 전체회원(`auth.users`) · 뉴스레터(`newsletter_subscribers`) · 과거구매자(`orders` distinct) · **위시리스트 제품별**(`wishlists`) · 직접입력 이메일
- ❌ **장바구니 미결제** — 장바구니가 localStorage(`ml_cart`) 전용이라 서버 조회 불가. **회원 장바구니 서버 동기화** 선행 필요 → 별도 기능으로 보류

### 작업 분해 (Phase별 독립 배포)
- **Phase 0 — 쿠폰 통일** ✅ **구현(추가·폴백 방식, 037 적용 대기)**: `issued_coupons`에 `scope/max_uses/used_count/is_active` + `redeem_public_coupon` RPC + `discount_codes` 멱등 백필(`037`). `validate`는 통합쿠폰(공개+개인) 우선 → 레퍼럴 → 레거시 `discount_codes` **폴백** 순. 공개쿠폰을 `kind:"coupon"`으로 반환해 **체크아웃 클라이언트·`save-order` 무수정**. 어드민 `/admin/coupons`에 공개쿠폰 발급 폼 추가. **남은 cleanup(추후)**: 라이브 검증 후 `discount_codes`·`/admin/discounts` 폐기, validate 폴백 제거
- **Phase 1 — 자동쿠폰 + 고객노출** ✅ **구현(새 테이블 없이)**: `lib/promotions.ts`(`grantSignupCoupon` — 가입 환영쿠폰 멱등 발급, `source='signup'` + 기존 `hasCouponFromSource` 재사용) · `account/points`·`account/coupons` 진입 시 보장 호출 · `GET /api/account/coupons`(소유 미사용·미만료 개인쿠폰) + 마이페이지 **"내 쿠폰" 탭**(i18n 7개국어) · `sendCouponEmail()`(발급 시 안내) · **가입쿠폰 enabled/percent/months 설정은 어드민 `/admin/coupons`(쿠폰 발급 메뉴)에 통합**(`SignupCouponCard`, 기본 10%/6개월, `site_settings`). ⚠️ promotions 규칙엔진 테이블은 불필요 → 원래 Phase 3(프로모션 CRUD+대시보드)로 이관
- **체크아웃 보유쿠폰 드롭다운** ✅: 로그인 시 `/api/account/coupons`로 보유 쿠폰을 불러와 **드롭다운 선택→즉시 적용**. 사용 불가(최소주문 미달) 쿠폰도 보이되 **비활성화+사유 표시**. i18n `selectCoupon`·`couponMinOrderShort` 7개국어
- **할인코드(discount_codes) 폐기** ✅ (#1 cleanup): validate 레거시 폴백·save-order `increment_discount_used`·`/admin/discounts`(페이지·API·네비) 전부 제거. 기능은 공개쿠폰으로 일원화(037 백필 완료). **선택적 `038_drop_discount_codes.sql`**(미사용 테이블·RPC drop, 미실행해도 무방)
- **주문 가격 분해** ✅ (#4): 주문에 `subtotal_usd/discount_usd/shipping_usd/points_spent_usd` 기록(`save-order` 산출, toss `shippingUsd` 전달) + 주문 상세(`orders/[id]`)에 소계·할인·마일리지·배송·결제금액 분해 표시(7개국어 인라인). ⚠️ **`039_order_price_breakdown.sql`** 필요(미적용 시 신규주문 분해 미기록·상세는 항목합계 폴백)
- **쿠폰 통합 관리 허브 C1** ✅ (#2-C1): `/admin/coupons` **분류 탭**(전체보기/개별/전체/신입환영/프로모션/정기) + 공개쿠폰 **사용기간(starts_at·종료일)** 입력. validate가 `starts_at` enforce(기간 전 무효). ⚠️ **`040_coupon_period.sql`** 필요.
- **쿠폰 1인당 한도 C2a** ✅ (#2-C2a): `per_user_limit` + `coupon_redemptions`(사용이력) — save-order가 사용 시 이력 기록, validate가 1인당 한도 enforce(로그인 회원). 어드민 공개쿠폰 폼에 "1인당 사용 한도" 입력. ⚠️ **`041_coupon_per_user_limit.sql`** 필요.
- **쿠폰 상품/카테고리 한정 C2b** ✅ (#2-C2b): `coupon_products`/`coupon_categories` 한정 → **해당 상품 소계에만 할인**(대상 없으면 사용 불가). 어드민 공개쿠폰 폼에 상품 체크리스트+카테고리 선택. **결제 서버측 할인 재계산**(`resolveOrderDiscountUsd` — lemon-checkout·toss-confirm이 클라이언트 `discountAmount` 불신, 쿠폰/레퍼럴 서버 재계산 → 정합성·보안 강화). `order-pricing.computeServerLineTotals`(상품별 라인합계). validate에 items 전달. 체크아웃 드롭다운: 대상 상품 없는 쿠폰 비활성(`couponNotApplicable`). **개인 쿠폰도 타게팅 지원**(발급 폼에 상품/카테고리 선택기 — 회원에게 발급 시 그 회원 "내 쿠폰" 드롭다운에 뜨고 대상 상품 담을 때만 활성). ⚠️ **`042_coupon_targeting.sql`** 필요. **남은 #2**: C3(트리거: 위시리스트 N일+ 먼저, 장바구니는 서버동기화 선행). 🔒 **비타게팅 쿠폰은 기존과 동일 동작**(회귀 차단)
- **Phase 2 — 이벤트 일괄발급**: `POST /api/admin/coupons/bulk`(대상 5종·이메일 배치·상한·중복가드) + 어드민 UI
- **Phase 3 — 프로모션 CRUD + 대시보드**: `/api/admin/promotions` + 관리 UI + 소스별 발급·사용·전환율 집계, 어드민 네비 메뉴 추가

### 영향 주의
- **체크아웃 결제 경로**(`discounts/validate`, `save-order`, lemon/toss confirm·webhook의 코드 사용처리)가 통합 모델로 바뀜 → 회귀 테스트 필수
- i18n은 **고객 노출분만 7개국어**(내 쿠폰 탭·쿠폰 이메일), 어드민은 한국어

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
