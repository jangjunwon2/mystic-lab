-- 재입고 알림 구독 테이블
CREATE TABLE IF NOT EXISTS restock_alerts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (product_id, email)
);

ALTER TABLE restock_alerts ENABLE ROW LEVEL SECURITY;

-- 삽입은 누구나 가능 (이메일 입력 방식 지원)
CREATE POLICY "restock_alerts_insert" ON restock_alerts
  FOR INSERT WITH CHECK (true);

-- 삭제는 이메일 매칭 또는 본인 user_id
CREATE POLICY "restock_alerts_delete" ON restock_alerts
  FOR DELETE USING (
    email = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    OR user_id = auth.uid()
  );

-- 조회는 service role에서만 (cron)
CREATE INDEX IF NOT EXISTS restock_alerts_product_id_idx ON restock_alerts(product_id);
CREATE INDEX IF NOT EXISTS restock_alerts_notified_idx ON restock_alerts(notified_at) WHERE notified_at IS NULL;
