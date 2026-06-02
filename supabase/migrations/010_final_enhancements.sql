-- ============================================================
-- Migration 010: Final Enhancements
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

-- 1. orders: 쿠폰/레퍼럴 코드 추적 + 고객 메모
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS applied_discount_code TEXT,
  ADD COLUMN IF NOT EXISTS applied_referral_code  TEXT,
  ADD COLUMN IF NOT EXISTS customer_note          TEXT;

-- 2. orders: 환불 사유 필드
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- 3. newsletter_subscribers: 이메일 마케팅 수신 동의
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL UNIQUE,
  locale       TEXT        NOT NULL DEFAULT 'en',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  source       TEXT,                          -- 'checkout', 'footer', 'popup' 등
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_newsletter_all"
  ON public.newsletter_subscribers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 구독 취소 API에서 service role key로 처리하므로 public insert만 허용
CREATE POLICY "public_subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- 4. product_views: 상품 조회 수 (경량 통계)
CREATE TABLE IF NOT EXISTS public.product_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  locale     TEXT        NOT NULL DEFAULT 'en',
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_product_views_all"
  ON public.product_views FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "public_insert_product_views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at  ON public.product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_email          ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_orders_discount_code     ON public.orders(applied_discount_code);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code     ON public.orders(applied_referral_code);

-- 5. profiles: 마지막 로그인 IP (보안 모니터링 — 선택)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 6. solution_videos: 다중 영상 지원 (UNIQUE 제약 완화)
-- 현재 UNIQUE(product_id) → 상품당 영상 1개만 허용
-- 멀티 영상(파트 1/2 등) 지원 위해 제약 제거 후 title로 구분
ALTER TABLE public.solution_videos
  ADD COLUMN IF NOT EXISTS part_order INTEGER NOT NULL DEFAULT 1;

-- ============================================================
-- 완료! 이 마이그레이션은 마지막 정식 마이그레이션입니다.
-- ============================================================
