-- 서버 장바구니 — 로그인 회원 localStorage(ml_cart) 동기화 전용.
-- 클라이언트가 장바구니 페이지 방문 시 full-replace로 동기화.
-- 장바구니 잔존 트리거 쿠폰(cron)이 이 테이블을 읽어 N일+ 미갱신 상품을 감지한다.

CREATE TABLE IF NOT EXISTS cart_items (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id  uuid NOT NULL,
  option_id   text NOT NULL DEFAULT '',
  quantity    int  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  slug        text NOT NULL DEFAULT '',
  name        text NOT NULL DEFAULT '',
  price_usd   numeric(10,2) NOT NULL DEFAULT 0,
  option_name text,
  synced_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id, option_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart"
  ON cart_items FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx
  ON cart_items(user_id);

-- 장바구니 잔존 쿠폰 cron용: 상품·갱신시각 복합 조회
CREATE INDEX IF NOT EXISTS cart_items_product_synced_idx
  ON cart_items(product_id, synced_at);
