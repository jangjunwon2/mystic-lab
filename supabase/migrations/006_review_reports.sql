-- ============================================================
-- Phase 4+: Review Reports
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reported_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_insert_report"
  ON public.review_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_select_reports"
  ON public.review_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admin_delete_reports"
  ON public.review_reports FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Add is_reported flag to reviews for fast admin filtering
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT false;
