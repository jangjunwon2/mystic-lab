-- ============================================================
-- RLS 재귀 문제 수정 + dormant 상태 추가
-- Supabase SQL Editor에서 한 번에 실행
-- ============================================================

-- 1. SECURITY DEFINER 함수: profiles 재귀 없이 admin 체크
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. profiles 테이블 재귀 정책 교체
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 3. products 테이블 정책 교체 (홈페이지 쿼리 수정)
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. solution_videos 정책 교체
DROP POLICY IF EXISTS "Members can view purchased solution videos" ON public.solution_videos;
CREATE POLICY "Members can view purchased solution videos"
  ON public.solution_videos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.order_items oi ON oi.order_id = o.id
        WHERE o.user_id = auth.uid()
          AND oi.product_id = solution_videos.product_id
          AND o.status IN ('paid', 'shipped', 'completed')
      )
      OR EXISTS (
        SELECT 1 FROM public.manual_video_grants mvg
        WHERE mvg.user_id = auth.uid()
          AND mvg.product_id = solution_videos.product_id
          AND (mvg.expires_at IS NULL OR mvg.expires_at > NOW())
      )
    )
  );

-- 5. manual_video_grants 정책 교체
DROP POLICY IF EXISTS "Admins can manage manual grants" ON public.manual_video_grants;
CREATE POLICY "Admins can manage manual grants"
  ON public.manual_video_grants FOR ALL
  USING (public.is_admin());

-- 6. discount_codes 정책 교체
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  USING (public.is_admin());

-- 7. announcements 정책 교체
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin());

-- 8. profiles 테이블에 dormant 상태 추가
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint c
  WHERE c.conrelid = 'public.profiles'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%suspended%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'suspended', 'banned', 'dormant'));
