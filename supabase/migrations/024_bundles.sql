-- 세트(번들) 상품: 여러 상품을 묶어 할인가에 판매
CREATE TABLE IF NOT EXISTS public.bundles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  discount_percent INTEGER     NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bundle_items (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id  UUID    NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  product_id UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  UNIQUE (bundle_id, product_id)
);

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- 활성 세트는 누구나 조회 가능(프론트 노출). 생성/수정은 service-role 어드민이 대행.
CREATE POLICY "anyone_view_active_bundles"
  ON public.bundles FOR SELECT USING (is_active = true);
CREATE POLICY "anyone_view_bundle_items"
  ON public.bundle_items FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON public.bundle_items(bundle_id);
