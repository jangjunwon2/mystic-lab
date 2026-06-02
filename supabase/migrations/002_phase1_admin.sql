-- ============================================================
-- Phase 1 Admin Features
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

-- 1. profiles: 회원 상태 필드 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'banned'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 2. 수동 영상 접근 권한 테이블
CREATE TABLE IF NOT EXISTS public.manual_video_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  note TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.manual_video_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage manual grants"
  ON public.manual_video_grants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own grants"
  ON public.manual_video_grants FOR SELECT
  USING (auth.uid() = user_id);

-- 3. solution_videos RLS 업데이트: manual grants 포함
DROP POLICY IF EXISTS "Members can view purchased solution videos" ON public.solution_videos;

CREATE POLICY "Members can view purchased solution videos"
  ON public.solution_videos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.order_items oi ON oi.order_id = o.id
        WHERE o.user_id = auth.uid()
          AND oi.product_id = solution_videos.product_id
          AND o.status IN ('paid', 'shipped', 'completed')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.manual_video_grants mvg
        WHERE mvg.user_id = auth.uid()
          AND mvg.product_id = solution_videos.product_id
          AND (mvg.expires_at IS NULL OR mvg.expires_at > NOW())
      )
    )
  );
