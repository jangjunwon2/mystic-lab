-- Add shipping_method column to track customer's preferred shipping option
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'standard';
