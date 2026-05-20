-- ============================================================
-- Phase 3 Admin Features
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

-- Referral codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT          NOT NULL UNIQUE,
  referrer_name    TEXT          NOT NULL,
  referrer_email   TEXT,
  discount_percent NUMERIC(5,2)  NOT NULL DEFAULT 0,
  uses             INTEGER       NOT NULL DEFAULT 0,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_referral_codes_all"
  ON public.referral_codes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "public_select_active_referral_codes"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);

CREATE OR REPLACE FUNCTION public.increment_referral_uses(code_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.referral_codes
  SET uses = uses + 1
  WHERE id = code_id;
$$;
