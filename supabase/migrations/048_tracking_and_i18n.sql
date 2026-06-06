-- 방문자 추적: 날짜+세션ID 기반 중복 제거된 일일 방문자 집계
CREATE TABLE IF NOT EXISTS site_visits (
  date       date NOT NULL,
  session_id text NOT NULL,
  PRIMARY KEY (date, session_id)
);

CREATE INDEX IF NOT EXISTS site_visits_date_idx ON site_visits(date);

-- 누구든 insert 가능(공개), 관리자만 select 가능(RLS)
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_site_visits" ON site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_select_site_visits" ON site_visits FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 번역 컬럼 추가 (announcements, promo_pages)
-- 형식: { "en": "...", "ja": "...", "zh-CN": "...", "es": "...", "fr": "...", "de": "..." }
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS translations jsonb;

-- promo_pages 번역: 필드별 { "en": { "title":"...", "subtitle":"...", "description":"..." }, ... }
ALTER TABLE promo_pages ADD COLUMN IF NOT EXISTS translations jsonb;
