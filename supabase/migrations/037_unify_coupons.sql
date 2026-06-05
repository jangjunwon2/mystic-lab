-- 쿠폰 통합 (Phase 0) — discount_codes(공개·다회용)를 issued_coupons에 흡수.
-- issued_coupons를 scope('personal'|'public') 단일 쿠폰 모델로 확장한다.
-- referral_codes는 의미가 달라(추천인 보상) 별개 유지.
-- 후방호환: discount_codes 테이블·/admin/discounts는 이 단계에서 폐기하지 않는다.
--           백필 후에도 validate가 레거시 discount_codes를 폴백으로 조회하므로 기존 코드가 계속 동작한다.

-- 1) issued_coupons 확장 — 공개형(소유자 없음·다회) 지원 컬럼.
ALTER TABLE public.issued_coupons
  ADD COLUMN IF NOT EXISTS scope      TEXT    NOT NULL DEFAULT 'personal',  -- 'personal' | 'public'
  ADD COLUMN IF NOT EXISTS max_uses   INTEGER,                             -- null = 무제한 (public 전용)
  ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0,          -- public 사용 횟수
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- 대시보드 소스별 집계용 인덱스.
CREATE INDEX IF NOT EXISTS idx_issued_coupons_source ON public.issued_coupons(source);

-- 2) 공개쿠폰 원자적 사용 처리 — used_count 증가(한도 초과·만료·비활성 차단). 성공 시 true.
--    동시 결제에서 max_uses 초과 차단(낙관적 조건부 UPDATE).
CREATE OR REPLACE FUNCTION public.redeem_public_coupon(p_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE public.issued_coupons
  SET used_count = used_count + 1
  WHERE upper(code) = upper(p_code)
    AND scope = 'public'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- 3) 데이터 이관 — 기존 discount_codes 를 issued_coupons(scope='public')로 멱등 백필.
--    코드 충돌(이미 이관됨/동일 코드 존재) 시 건너뛴다. discount_codes 원본은 보존(폴백·롤백용).
INSERT INTO public.issued_coupons (code, type, value, source, scope, max_uses, used_count, is_active, expires_at, created_at)
SELECT code, type, value, 'promo', 'public', max_uses, used_count, is_active, expires_at, created_at
FROM public.discount_codes
ON CONFLICT (code) DO NOTHING;
