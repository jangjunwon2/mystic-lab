-- 상품 구매 옵션(추가 구성/세트) — 상품 상세의 드롭다운에서 선택.
-- 기본가(products.price_usd)에 price_delta_usd를 더해 판매한다. (음수=할인, 양수=추가요금)
CREATE TABLE IF NOT EXISTS public.product_options (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name             TEXT          NOT NULL,
  price_delta_usd  NUMERIC(10,2) NOT NULL DEFAULT 0,
  display_order    INTEGER       NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- 옵션은 누구나 조회 가능(상세 페이지 노출). 생성/수정/삭제는 service-role 어드민이 대행.
CREATE POLICY "anyone_view_product_options"
  ON public.product_options FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_product_options_product ON public.product_options(product_id);

-- 주문 항목에 선택된 옵션명을 기록(배송/CS용). NULL이면 기본 구성.
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS option_name TEXT;
