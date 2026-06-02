-- Helper function: email로 auth.users.id 조회 (service role 전용)
-- save-order.ts에서 전체 유저 목록 로드 없이 이메일로 user_id 찾기 위해 사용
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = lower(p_email) LIMIT 1;
  RETURN v_id;
END;
$$;

-- service role만 호출 가능
REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;
