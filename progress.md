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
- 장바구니(**부분 선택 결제**) · 즉시구매 · **할인·레퍼럴·개인 쿠폰**(공용 입력창) · **마일리지 사용/적립** · **체크아웃 쿠폰 드롭다운**(보유 개인쿠폰 + **발급받은** 공개쿠폰, 최소주문·상품한정 미충족분은 비활성, **코드 대신 쿠폰 이름 표시**)
- **쿠폰 배포 2방식** ✅: ① **회원 직접 할당**(개인 쿠폰) ② **전용 발급 페이지**(공개 쿠폰 — `/[locale]/coupons`에서 claim). 공개 쿠폰은 `coupon_claims` 기록 있어야 validate 통과. 마이페이지 "내 쿠폰" 탭 + 발급 가능분은 발급 페이지 링크.
- **쿠폰 엔진 전체**: 자동발급(가입 환영·위시리스트 정기·장바구니 잔존·레퍼럴 보상) · 이벤트 일괄발급(`/api/admin/coupons/bulk`) · 프로모션 대시보드 · 이름·정지/삭제 · 1인당/전체 한도 · 상품/카테고리 한정 · 사용기간
- 결제: **LemonSqueezy**(해외 USD) / **Toss**(국내 KRW) — 서버 가격검증·멱등성·재고 CAS·실시간 환율
- 회원: 이메일 + Google OAuth(인앱브라우저 감지), 마이페이지(주문/튜토리얼/위시리스트/배송지/마일리지) · **주문내역에서 웹앱(계산기·인스타) 열기**
- 배송지 저장 · 국가선택(195개국) · 배송방법(EMS/Express +$15) · 주문 추적 링크
- 해법영상: 구매검증 후 **시청 전용 페이지**(Vimeo 임베드 / Cloudflare signed)
- 커스텀 의뢰 폼 · 법적 페이지(개인정보/약관/환불/배송, 7개 언어) · **법적고지(`/legal-notice`)** · about/contact

### 어드민 (/admin · 한국어)
- 대시보드 · 통계(매출·전환율·위시→구매·공유·결제수단/국가 분포·**고객 세그먼트**·**기간 지정 CSV 내보내기**)
- 상품 CRUD(이미지 업로드·드래그정렬·Claude 자동번역·옵션 빌더·디지털 토글)
- 주문(상세·상태·**환불=게이트웨이 실환불+재고/포인트 복원**·배송추적·선택삭제)
- 배송 관리 · 리뷰(게시 관리) · 커스텀의뢰 · 영상 · 공지 · 뉴스레터 · **구매자 커뮤니티 관리**
- **쿠폰 관리 허브**(`/admin/coupons`): 분류 탭(개별/전체/신입/프로모션/정기) · 개인·공개 쿠폰 발급 · 삭제/정지 · 가입/위시리스트/장바구니 자동쿠폰 설정 카드 · 프로모션 대시보드
- **레퍼럴/제휴 코드**: 정률/정액 할인 + 추천인 보상 쿠폰 자동발급
- 잠금코드(상품별·기기바인딩·강제해제·AES 암호화)
- 회원(트라이그램 검색) · **증정/권한부여**(상품권한·무료주문·마일리지 지급)
- **펌웨어 관리**(`/admin/firmware`): ESP32-S3 소스 ZIP 업로드 → GitHub Actions 자동 빌드 → 기기 OTA. 빌드 중 pending 상태 즉시 표시 · 빌드 완료 후 자동 URL 등록 · 장치 자동 감지/등록 · 다중 장치 일괄 업로드

### ESP32-S3 펌웨어 시스템 (Nexus 기기)
- **대상 기기**: nexus_pot · nexus_flux_case · nexus_receiver · nexus_transmitter · nexus_smoke (5종, ESP32-S3)
- **GitHub**: `jangjunwon2/nexus-firmware` · Actions `firmware-deploy.yml` — 빌드(`CDCOnBoot=cdc` FQBN)·릴리즈 자동화
- **CDCOnBoot=cdc**: OTA 후 시리얼이 USB CDC 대신 물리 UART로 빠지는 문제 해결
- **OTA 흐름**: 기기 → `/api/firmware/latest?device=X` → `isVersionNewer()` 로 비교 → 바이너리 다운로드 → `Update.h` 적용 → 재부팅
  - `/api/firmware/latest`: 완료된 릴리스(download_url ≠ "")만 반환 — 빌드 대기 중에는 이전 버전 유지
  - `http.getString()` (Vercel chunked 전송 파싱 수정) · `_otaFirmwareUrl` 멤버 변수로 URL 전달
- **버전 관리**: `config.h`(또는 `config_t.h`)의 `FIRMWARE_VERSION` 단일 소스 — `#define`/`constexpr` 두 형식 모두 지원. `version.txt` 사용 안 함
- **버전 비교**: `isVersionNewer()` — 서버 버전이 엄격히 높을 때만 업데이트(다운그레이드 불가, 서버는 다운그레이드 가능)
- **어드민 업로드 안정성** (2026-06-09 완성):
  - **INSERT-FIRST**: pending 행을 먼저 삽입 → 다른 행 삭제 → UI 즉시 반영
  - **UPDATE 기반 stale guard**: Actions POST 시 `PATCH WHERE device+version+download_url=''` — 버전 불일치(다른 버전이 이미 업로드됨) 시 자동 skip
  - **concurrency**: `cancel-in-progress: true` — 새 push 시 이전 Actions 자동 취소
  - **구 릴리스 보호**: "Delete old releases" 스텝이 pending 행(download_url='') 보호
  - **`.ino.bin`**: OTA 애플리케이션 바이너리만 선택(bootloader·partitions.bin 제외)
- **실기기 OTA 확인**: nexus_pot ✅ (2026-06-08) · nexus_smoke ✅ (2026-06-09, v1.0→v1.1)
- ⚠️ **업로드 주의**: 어드민 ZIP 업로드 시 반드시 로컬 수정본(`도구 개발 - 복사본`)을 압축할 것 — 원본 파일로 덮어쓰면 패치가 초기화됨

### 결제·포인트 정합성
- 멱등성 가드(gateway key 중복 차단), 재고 낙관적 동시성(CAS+재시도)
- **주문↔회원 연결**: 로그인 `user_id` 우선 → 게이트웨이 결제 이메일이 달라도 본인 주문 연결
- 포인트: **12개월 FIFO 만료**(로트 원장 + RPC + 일일 cron), 환불 시 복원, **동시결제 과할인 차단**(hold/예약)
- 포인트 정책: 가입 환영 적립 200P · 최소 보유 $5(500P) 하한 · 적립률 어드민 가변 설정(기본 5%)
- 디지털 상품은 결제 즉시 `completed` → 구매 직후 리뷰 가능

### 마술 계산기 (PWA, `/calc`)
- 위장 계산기(iOS / 삼성 One UI) + 트릭: 포스(C 3초·고정값/시간), 피킹(9번 1초+좌스와이프 로그), 앞자리삭제(+/- 토글+좌스와이프), 결과복원, 페이크 인스타(`0000=`), BLE 감열 프린터(= 3초)
- 사칙연산 **안전 파서(safeEval)** · **1코드=1기기 라이선싱**(AES 암호화) · **7개 언어** (인앱 매뉴얼 + 비밀 설정창)

### 인스타 앱 (PWA, `/insta` · 독립 상품 `fake-instagram`)
- 피드/프로필/게시물상세/스토리/릴스/DM + 하이라이트 스토리, 비밀설정으로 콘텐츠 커스텀
- **7개 언어** · 게시물 음원 라인 · 피드 자연스러움(다른 계정 게시물 번갈아 노출·이니셜 아바타)
- **계산기↔인스타 예언 연동**: `ml_calc_instagram_prediction` 테이블 경유, `{force}`/`{num1}` 토큰 치환
- 라이선싱(`ml_dt_<id>` 쿠키) · **iOS 대응**(apple-touch-icon·풀스크린·아래당김 검정·overscroll-contain)

### 공통
- 프론트 다국어화 사실상 완료 · PWA(Android SW / iOS 미사용) · 실제 PNG 아이콘
- **줄바꿈 타이포그래피**: `text-wrap: balance/pretty` · CJK `word-break: keep-all`
- **보안 헤더**: HSTS·X-Content-Type-Options·X-Frame-Options·Referrer-Policy·Permissions-Policy · CSP Report-Only
- **Rate limit**: `lib/rate-limit` — Upstash Redis / in-memory 폴백
- **테스트**: vitest 단위 테스트 21 케이스 (`npm test`)

---

## 🔒 보안·품질 점검 (2026-06-05 완료, 재확인 불필요)

> 어드민 판별 이메일 기준 통일 · 결제 위조 차단 · Rate limit 확대 · 입력검증 · DB error.message 노출 제거(18곳) · XSS 방지 · 데드코드 제거. (상세는 git 이력)

---

## ⏳ 운영자(사장님) To-Do

> 마이그레이션 019~052 모두 순차 적용 완료.

- [ ] **(선택) 위시리스트 정기 쿠폰 켜기** — `/admin/coupons`의 "위시리스트 정기 쿠폰" 카드 활성화(기본 OFF)
- [ ] **(선택) 장바구니 잔존 쿠폰 켜기** — `/admin/coupons`의 "장바구니 잔존 쿠폰" 카드 활성화(기본 OFF)
- [ ] **법적고지 `/legal-notice` 자리표시자 기입** — 대표자명·사업장 주소·연락처·통신판매업 신고번호(+EU VAT). ⚠️ 변호사 검토 권장

---

## 🔍 점검 필요 (실기기/라이브)
- [ ] **인스타·계산기 앱 iOS 실기기 확인**: 홈 아이콘 · 풀스크린 · 아래당김 검정 → 기존 홈추가본 **삭제 후 재추가**
- [ ] 라이브 **국내(Toss) 결제·환불·리뷰** 확인 (LemonSqueezy ✅ 확인 완료)
- [ ] **쿠폰 시스템 라이브 확인**: 개인/공개 쿠폰 발급·사용·한도·이름 표시·정지/삭제·레퍼럴
- [ ] **포인트 정책 확인**: 가입 보너스 200P · $5 미만 사용 차단 · 적립률 변경 반영
- [ ] **계산기↔인스타 force 실기기 확인**: 계산기 입력 후 인스타 앱 '마지막에서 한개 이전' 게시물에 숫자 노출
- [ ] **공지 배너** X 닫힘 + **공유 팝업/인스타그램** 동작 확인
- [x] **Nexus OTA — nexus_pot**: CDCOnBoot=cdc OTA 후 USB 시리얼 정상 ✅ (2026-06-08)
- [x] **Nexus OTA — nexus_smoke**: v1.0→v1.1 OTA 정상 ✅ (2026-06-09)
- [ ] **Nexus OTA — 나머지 3종**: flux_case · receiver · transmitter — 실기기 OTA + 시리얼 확인 필요
- [ ] **Nexus WiFi 자동 재연결**: 재부팅 시 등록된 WiFi 자동 접속 여부 확인 (미확인 시 `WiFi.begin()` + 재시도 로직 추가)

---

## 🔜 앞으로 할 일 / 후보

### 쇼핑몰/앱
- **인스타 앱 마술 기믹 잔여** — 남은 것: 관객 *단어* 예언, 인스타 자체 입력 peek, 검색 탭 위장
- **프린터 제어 독립 앱** — 계산기 내장 BLE 인쇄를 이미지·폰트 편집 가능한 별도 앱으로 분리

### ESP32 펌웨어 (Nexus 기기)
- **WiFi 자동 재연결** — 미구현 확인 후 `WiFi.begin(ssid, pass)` + 재시도 로직 추가

---

## 📋 의도적 보류 / 결정 대기
- **Cloudflare Stream 대체(영상 자체 호스팅)** — Supabase 서명 URL + `<video>` 자체호스팅 가능. 현재 Vimeo 임베드 중. **적용 여부 결정 대기**
- **PortOne 결제** — 미구현(타입만). KakaoPay·NaverPay 추가 시 필요. 건드리지 말 것
- **`as any` 타입 정합화** — Supabase+TS `never` 추론 우회용 의도적 코드. 런타임 정상 → 유지 권장
- **계산기 NFC 매뉴얼 도메인 하드코딩**(`mystic-lab.vercel.app`) — 커스텀 도메인 전환 시 수정

---

## 환경변수
- **필수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`
- **결제**: `LEMON_SQUEEZY_API_KEY`/`STORE_ID`/`VARIANT_ID`/`WEBHOOK_SECRET`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
- **미디어/메일**: `CLOUDFLARE_ACCOUNT_ID`/`STREAM_TOKEN`/`STREAM_KEY_ID`/`STREAM_PRIVATE_KEY`(미설정 시 mock), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ANTHROPIC_API_KEY`(번역, claude-haiku-4-5)
- **기타**: `CRON_SECRET`, `UNLOCK_CODE_SECRET`(미설정 시 서비스롤 파생), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `GITHUB_PAT`(펌웨어 소스 push)
- **선택(Rate limit)**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **nexus-firmware GitHub Secrets**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

## 개발 명령어
```bash
cd C:\Users\jun92\Desktop\mystic-lab
npm run dev                       # 로컬 테스트
git add [파일] && git commit -m "..." && git push origin main   # → Vercel 배포
```
