-- 쿠폰 사용 기간 — 시작일(starts_at) 추가. 종료는 기존 expires_at 사용.
-- 프로모션(기간한정) 공개 쿠폰: [starts_at, expires_at] 구간에만 유효.
-- starts_at NULL = 즉시 시작(기존 동작 유지).

ALTER TABLE public.issued_coupons
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
