-- 디지털 상품 플래그: true면 결제 즉시 주문이 배송완료(completed)로 처리되어 바로 리뷰 작성 가능
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_digital BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_digital IS '디지털 상품 여부. true면 배송 없이 결제 즉시 completed 처리(예: 마술 계산기 앱).';

-- 마술 계산기 앱을 디지털 상품으로 표시
UPDATE public.products SET is_digital = true WHERE slug = 'magic-calculator';
