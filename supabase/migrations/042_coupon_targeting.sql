-- 쿠폰 상품/카테고리 한정 — 특정 상품 또는 카테고리에만 적용되는 쿠폰.
-- 한정이 설정된 쿠폰은 장바구니의 '해당 상품 소계'에만 할인 적용(없으면 사용 불가).
-- 둘 다 비어있으면 전체 적용(기존 동작). 서비스롤 전용.

CREATE TABLE IF NOT EXISTS public.coupon_products (
  coupon_id  UUID NOT NULL REFERENCES public.issued_coupons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  PRIMARY KEY (coupon_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.coupon_categories (
  coupon_id UUID NOT NULL REFERENCES public.issued_coupons(id) ON DELETE CASCADE,
  category  TEXT NOT NULL,
  PRIMARY KEY (coupon_id, category)
);

ALTER TABLE public.coupon_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon   ON public.coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_categories_coupon ON public.coupon_categories(coupon_id);
