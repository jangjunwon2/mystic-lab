-- 주문 가격 분해 — 주문 상세에서 소계(정가)·할인·포인트·배송비·결제가를 보여주기 위한 컬럼.
-- 신규 주문부터 채워진다(save-order가 기록). 기존 주문은 NULL → 상세에서 소계(항목합계)·총액만 표시.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_usd     NUMERIC(10,2),  -- 정가 소계(애드온 포함 항목 합계)
  ADD COLUMN IF NOT EXISTS discount_usd     NUMERIC(10,2),  -- 쿠폰/레퍼럴 할인액
  ADD COLUMN IF NOT EXISTS shipping_usd     NUMERIC(10,2),  -- 배송비
  ADD COLUMN IF NOT EXISTS points_spent_usd NUMERIC(10,2);  -- 사용 마일리지(USD 환산)
