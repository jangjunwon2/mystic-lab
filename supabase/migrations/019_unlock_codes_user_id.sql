-- 회원 구매 시 자동 발급되는 인증 코드를 회원 계정에 연결하기 위한 컬럼
ALTER TABLE public.product_unlock_codes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 회원에게 코드를 그대로 노출하기 위해 평문 코드 컬럼 보장(이미 있으면 무시)
ALTER TABLE public.product_unlock_codes
  ADD COLUMN IF NOT EXISTS code_plain TEXT;

-- (user_id, product_id) 조회 최적화 — 회원당 상품별 1개 코드 조회용
CREATE INDEX IF NOT EXISTS idx_unlock_codes_user_product
  ON public.product_unlock_codes(user_id, product_id);

COMMENT ON COLUMN public.product_unlock_codes.user_id IS '자동 발급 코드의 소유 회원(수동 동봉 코드는 NULL)';
