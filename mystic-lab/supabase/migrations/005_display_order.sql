-- ============================================================
-- Phase 4: Product Display Order
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

-- Add display_order to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Set initial order based on creation date (newest = lowest number)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.products
)
UPDATE public.products
SET display_order = ranked.rn
FROM ranked
WHERE public.products.id = ranked.id;
