-- Add default_address column to profiles for future profile-based persistence
-- Currently address is stored in user_metadata; this column is for future use
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_address JSONB;
