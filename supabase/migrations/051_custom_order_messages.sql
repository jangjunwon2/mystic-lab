-- 커스텀 주문 메시지 스레드 (관리자 ↔ 고객 대화)
CREATE TABLE IF NOT EXISTS custom_order_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid        NOT NULL REFERENCES custom_order_requests(id) ON DELETE CASCADE,
  sender     text        NOT NULL CHECK (sender IN ('admin', 'customer')),
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_order_messages_order_id
  ON custom_order_messages(order_id);

ALTER TABLE custom_order_messages ENABLE ROW LEVEL SECURITY;

-- 서비스 롤만 접근 (서버사이드 admin client 전용)
CREATE POLICY "Service role full access"
  ON custom_order_messages
  USING (true)
  WITH CHECK (true);
