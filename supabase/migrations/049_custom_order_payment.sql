-- 커스텀 주문 결제 기능: 견적 금액 + 결제 링크 토큰 + 결제 상태
ALTER TABLE custom_order_requests
  ADD COLUMN IF NOT EXISTS quoted_price_usd  numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quoted_price_krw  integer       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_token     uuid          UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status    text          NOT NULL DEFAULT 'unpaid';
