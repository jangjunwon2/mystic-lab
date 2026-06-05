-- 쿠폰 1인당 사용 한도 — 공개(다회용) 쿠폰을 한 회원이 몇 번까지 쓸 수 있는지 제한.
-- per_user_limit NULL = 무제한(기존 동작). 개인 쿠폰은 is_used로 이미 1회 제한이라 무관.
-- 사용 이력(coupon_redemptions)으로 1인당 사용 횟수를 집계한다(서비스롤 전용).

ALTER TABLE public.issued_coupons
  ADD COLUMN IF NOT EXISTS per_user_limit INTEGER;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT        NOT NULL,   -- 사용된 쿠폰 코드(대문자)
  user_id    UUID,                   -- 사용 회원(있으면)
  order_id   UUID,                   -- 사용 주문
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_code_user ON public.coupon_redemptions(code, user_id);
