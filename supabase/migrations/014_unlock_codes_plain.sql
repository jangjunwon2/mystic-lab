-- Add plain text code column so admins can always view generated codes
ALTER TABLE public.product_unlock_codes
  ADD COLUMN IF NOT EXISTS code_plain TEXT;
