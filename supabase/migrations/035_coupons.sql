-- 쿠폰 시스템 (#7) — 개인 발급 쿠폰 + 레퍼럴 보상/할인 타입 + 공지(프로모션) 쿠폰 코드.
-- service-role(admin client)로만 접근(RLS enable + 정책 없음).

-- 1) 개인 발급 쿠폰 — 특정 회원/이메일에게 1회용으로 지급(공용 discount_codes와 별개).
CREATE TABLE IF NOT EXISTS public.issued_coupons (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT         NOT NULL UNIQUE,
  user_id       UUID,                              -- 발급 대상 회원(있으면)
  email         TEXT,                              -- 이메일 기반 발급(비회원 포함)
  type          TEXT         NOT NULL DEFAULT 'percent',  -- 'percent' | 'fixed'
  value         NUMERIC(10,2) NOT NULL DEFAULT 0,         -- % 또는 $ 금액
  source        TEXT,                              -- 'newsletter' | 'referral' | 'manual' | 'promo' | 'signup'
  min_order_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_used       BOOLEAN      NOT NULL DEFAULT false,
  used_order_id UUID,
  used_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.issued_coupons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_issued_coupons_user  ON public.issued_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_issued_coupons_email ON public.issued_coupons(email);
CREATE INDEX IF NOT EXISTS idx_issued_coupons_code  ON public.issued_coupons(code);

-- 2) 레퍼럴 코드 — 신규 구매자 할인 타입(정률/정액) + 추천인 보상.
--    기존 discount_percent는 '신규 구매자 할인 값'으로 그대로 사용(타입에 따라 % 또는 $).
ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS discount_type          TEXT          NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  ADD COLUMN IF NOT EXISTS referrer_reward_type   TEXT,                                     -- 'percent' | 'fixed' | null(보상 없음)
  ADD COLUMN IF NOT EXISTS referrer_reward_value  NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 3) 공지(프로모션) — 표시용 쿠폰 코드(선택).
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;
