-- 회원 검색 성능 개선: profiles 에 email 동기화 + ILIKE 트라이그램 인덱스.
-- 기존엔 검색마다 auth.admin.listUsers(1000건 풀스캔) + profiles 전체 스캔 → 단일 인덱스 쿼리로 대체.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 기존 회원 email 백필
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS DISTINCT FROM u.email);

-- 신규 가입 시 email 도 채우도록 트리거 갱신 (016의 배송지 로직 보존 + email 추가)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_addr JSONB;
BEGIN
  v_addr := NEW.raw_user_meta_data->'default_address';

  INSERT INTO public.profiles (id, display_name, email, default_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_addr
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_addr IS NOT NULL
     AND COALESCE(v_addr->>'line1', '') != ''
  THEN
    INSERT INTO public.shipping_addresses (user_id, name, phone, line1, line2, city, postal, country, is_default)
    VALUES (
      NEW.id,
      COALESCE(v_addr->>'name', ''),
      v_addr->>'phone',
      v_addr->>'line1',
      NULLIF(v_addr->>'line2', ''),
      NULLIF(v_addr->>'city', ''),
      NULLIF(v_addr->>'postal', ''),
      UPPER(COALESCE(v_addr->>'country', '')),
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ILIKE '%q%' 가속용 트라이그램 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm ON public.profiles USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm  ON public.profiles USING gin (display_name gin_trgm_ops);
