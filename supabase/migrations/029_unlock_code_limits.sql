-- 마술 계산기 라이선싱 강화: 코드 1개로 기기 무제한 재활성화(공유 악용) 방지.
--   activation_count: 누적 기기 활성화 횟수
--   max_activations : 허용 활성화 한도 (NULL = 무제한). 신규 코드 기본 5회
--   is_locked       : 관리자 수동 잠금 (true 면 인증 불가)
ALTER TABLE public.product_unlock_codes
  ADD COLUMN IF NOT EXISTS activation_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_activations  INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_locked        BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.product_unlock_codes.activation_count IS '누적 기기 활성화 횟수';
COMMENT ON COLUMN public.product_unlock_codes.max_activations IS '허용 활성화 한도 (NULL=무제한)';
COMMENT ON COLUMN public.product_unlock_codes.is_locked IS '관리자 수동 잠금 여부';
