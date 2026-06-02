-- ============================================================
-- Phase 7: Admin User Notes
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;
