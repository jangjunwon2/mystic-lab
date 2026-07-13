-- Reset default for is_active to false to support manual deployment gating
ALTER TABLE public.firmware_releases 
    ALTER COLUMN is_active SET DEFAULT false;

-- Reset existing records to false so version priority logic handles latest naturally
UPDATE public.firmware_releases 
    SET is_active = false;

-- Add index on is_active for faster lookup in latest API queries
CREATE INDEX IF NOT EXISTS idx_firmware_releases_is_active 
    ON public.firmware_releases(device_type, is_active DESC, created_at DESC);
