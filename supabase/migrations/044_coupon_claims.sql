-- 공개 쿠폰 발급(claim) — 공개 쿠폰은 보이되, 고객이 직접 발급받아야 사용 가능.
-- 발급 기록이 있어야 validate가 사용을 허용한다. 회원당 1회 발급(UNIQUE). 서비스롤 전용.

CREATE TABLE IF NOT EXISTS public.coupon_claims (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID        NOT NULL REFERENCES public.issued_coupons(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)
);

ALTER TABLE public.coupon_claims ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coupon_claims_user   ON public.coupon_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_claims_coupon ON public.coupon_claims(coupon_id);
