-- ============================================================
-- Phase 5: Manual Video Grants
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.manual_video_grants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  note        TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.manual_video_grants ENABLE ROW LEVEL SECURITY;

-- Users can see their own grants (needed for access check)
CREATE POLICY "users_select_own_grants"
  ON public.manual_video_grants FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can manage grants
CREATE POLICY "admin_all_grants"
  ON public.manual_video_grants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
