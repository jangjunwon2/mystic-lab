-- 쿠폰 이름(명목) — "고객 감사 쿠폰", "특정 제품 할인" 등. 고객 드롭다운엔 코드 대신 이름을 노출.
-- NULL = 이름 없음(드롭다운에서 할인/코드로 폴백 표시).

ALTER TABLE public.issued_coupons
  ADD COLUMN IF NOT EXISTS name TEXT;
