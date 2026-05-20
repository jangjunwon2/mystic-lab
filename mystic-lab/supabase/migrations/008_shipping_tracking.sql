-- ============================================================
-- Phase 6: Shipping Tracking
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;
