-- 펌웨어 배포 이력 (OTA 업데이트)
CREATE TABLE IF NOT EXISTS firmware_releases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type  text        NOT NULL DEFAULT 'default',
  version      text        NOT NULL,
  download_url text        NOT NULL,
  storage_path text        NOT NULL,
  file_size    integer,
  notes        text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firmware_device_type
  ON firmware_releases(device_type, created_at DESC);

ALTER TABLE firmware_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON firmware_releases
  USING (true)
  WITH CHECK (true);
