-- ============================================================
-- Phase 2 Admin Features
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- ============================================================

-- Helper: atomic increment for discount used_count
CREATE OR REPLACE FUNCTION public.increment_discount_used(code_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.discount_codes
  SET used_count = used_count + 1
  WHERE id = code_id;
$$;

-- 1. Discount codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  type        TEXT        NOT NULL CHECK (type IN ('percent', 'fixed')),
  value       NUMERIC(10,2) NOT NULL,
  max_uses    INTEGER,
  used_count  INTEGER     NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_discount_codes_all"
  ON public.discount_codes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "public_select_active_codes"
  ON public.discount_codes FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- 2. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message     TEXT        NOT NULL,
  link_url    TEXT,
  link_label  TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT false,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_announcements_all"
  ON public.announcements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "public_view_active_announcements"
  ON public.announcements FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
  );
