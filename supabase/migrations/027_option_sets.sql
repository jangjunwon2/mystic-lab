-- 구매 옵션을 '기존 상품 결합(세트)'까지 지원하도록 확장.
-- 옵션은 두 종류:
--   1) 단순 추가옵션: price_delta_usd 사용 (기존)
--   2) 세트: product_option_items 에 구성 상품을 담고, 가격은
--      set_price_usd(고정가)가 있으면 그 값, 없으면 (호스트가 + 구성가 합계) × (1 - discount_percent/100)
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS set_price_usd  NUMERIC(10,2);
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS discount_percent INTEGER;

-- 세트 구성 상품 (옵션 1개 = 호스트 상품 + 구성 상품 N개)
CREATE TABLE IF NOT EXISTS public.product_option_items (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id  UUID    NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  product_id UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1)
);

ALTER TABLE public.product_option_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_product_option_items"
  ON public.product_option_items FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_product_option_items_option ON public.product_option_items(option_id);

-- 주문 항목에 세트 그룹 식별자 추가 (세트 구성품을 한 묶음으로 표시/집계)
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS option_id UUID;
