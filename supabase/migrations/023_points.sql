-- 마일리지(포인트) 원장: 1 point = $0.01 (100 point = $1)
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      INTEGER     NOT NULL,            -- +적립 / -사용
  type        TEXT        NOT NULL,            -- earn | spend | adjust | refund
  order_id    UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- 본인 내역만 조회 가능 (적립/사용/조정 기록은 service-role 서버 로직이 작성)
CREATE POLICY "users_select_own_points"
  ON public.point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_point_tx_user ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_created ON public.point_transactions(created_at);

-- 잔액 조회 함수 (service-role 전용)
CREATE OR REPLACE FUNCTION public.get_points_balance(p_user UUID)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER FROM public.point_transactions WHERE user_id = p_user;
$$;
REVOKE ALL ON FUNCTION public.get_points_balance(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_points_balance(UUID) TO service_role;
