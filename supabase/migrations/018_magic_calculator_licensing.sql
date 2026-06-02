-- 마술 계산기 1단말기 전용 인증 세션 관리를 위한 컬럼 추가
ALTER TABLE public.product_unlock_codes
ADD COLUMN active_token_hash TEXT,
ADD COLUMN last_activated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.product_unlock_codes.active_token_hash IS '현재 활성화된 기기의 토큰 SHA-256 해시값';
COMMENT ON COLUMN public.product_unlock_codes.last_activated_at IS '가장 최근에 기기가 등록/활성화된 일시';
