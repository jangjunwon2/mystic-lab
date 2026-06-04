-- 구매 옵션을 '함께 구매 가능한 개별 상품(애드온)' 모델로 전환.
-- 호스트 상품 페이지에서 여러 애드온을 체크박스로 다중 선택 → 각 애드온이 개별 할인가로
-- 장바구니에 함께 담기고, 구매 완료 시 각 상품(장치)에 권한이 부여된다.
--   discount_type: 'percent'(할인율 %) | 'fixed'(정액 할인 $)
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS linked_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS discount_type     TEXT;
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS discount_value    NUMERIC(10,2);

-- name 은 더 이상 필수가 아님(애드온 라벨은 연결된 상품명에서 파생)
ALTER TABLE public.product_options ALTER COLUMN name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_options_linked ON public.product_options(linked_product_id);
