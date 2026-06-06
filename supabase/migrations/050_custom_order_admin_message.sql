-- 커스텀 주문: 고객에게 표시할 관리자 답변 저장 컬럼
ALTER TABLE custom_order_requests
  ADD COLUMN IF NOT EXISTS admin_message text DEFAULT NULL;
