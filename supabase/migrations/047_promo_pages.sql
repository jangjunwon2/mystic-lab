-- 프로모션 랜딩 페이지. 각 페이지는 /promo/[slug]로 접근 가능.
-- 공개 쿠폰(scope='public')과 연결하여 클레임 버튼 제공.
CREATE TABLE IF NOT EXISTS promo_pages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        UNIQUE NOT NULL,
  title       text        NOT NULL,
  subtitle    text,
  description text,
  image_url   text,
  badge_text  text,
  coupon_id   uuid        REFERENCES issued_coupons(id) ON DELETE SET NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  ends_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_pages_slug_idx ON promo_pages(slug);
CREATE INDEX IF NOT EXISTS promo_pages_active_idx ON promo_pages(is_active);
