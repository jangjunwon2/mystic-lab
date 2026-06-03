-- 공유 트래킹: 어떤 상품이 어느 채널로 공유됐는지 집계 (통계 메뉴용)
CREATE TABLE IF NOT EXISTS public.share_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  channel     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
-- 조회는 service role(어드민)만. 기록(INSERT)은 서버의 service-role API가 대행하므로 공개 정책 불필요.

CREATE INDEX IF NOT EXISTS idx_share_events_product ON public.share_events(product_id);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON public.share_events(created_at);
CREATE INDEX IF NOT EXISTS idx_share_events_channel ON public.share_events(channel);
