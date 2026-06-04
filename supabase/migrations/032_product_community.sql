-- 상품(장치)별 커뮤니티 — 구매자 전용
--   type='suggestion' 개선 제안 / 'staging' 연출 공유 (구매자 작성)
--   type='update'     업데이트 공지 (어드민 작성)
-- 접근(읽기·쓰기)은 전부 service-role API가 구매 검증 후 매개한다. RLS는 잠금(공개 정책 없음).

CREATE TABLE IF NOT EXISTS public.product_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  type        TEXT        NOT NULL CHECK (type IN ('suggestion', 'staging', 'update')),
  title       TEXT,
  body        TEXT        NOT NULL,
  is_pinned   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_hidden   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_post_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES public.product_posts(id) ON DELETE CASCADE,
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  body        TEXT        NOT NULL,
  is_hidden   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_posts_pt
  ON public.product_posts(product_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post
  ON public.product_post_comments(post_id, created_at);

ALTER TABLE public.product_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_post_comments ENABLE ROW LEVEL SECURITY;
-- 공개 정책 없음 — service-role 서버 로직만 접근(구매 검증). service-role은 RLS 우회.
