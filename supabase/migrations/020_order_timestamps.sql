-- 주문 배송 시작/완료 시각 추적 컬럼
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.shipped_at IS '배송 시작(shipped 전환) 시각';
COMMENT ON COLUMN public.orders.completed_at IS '배송 완료(completed 전환) 시각';
