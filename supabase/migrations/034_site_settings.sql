-- 사이트 전역 설정(키-값) — 어드민이 런타임에 조정. (포인트 적립률 등)
-- service-role(admin client)로만 접근(RLS enable + 정책 없음 → anon 차단).

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 기본 포인트 적립률(5%). 이미 있으면 유지.
INSERT INTO public.site_settings (key, value)
VALUES ('point_earn_rate', '0.05')
ON CONFLICT (key) DO NOTHING;
