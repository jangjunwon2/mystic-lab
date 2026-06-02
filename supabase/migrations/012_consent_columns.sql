-- Add consent tracking columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_agreed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMPTZ;
