-- 마일리지 포인트 hold(예약) — 동시 결제 시 '과할인' race 완전 차단 (031 위에 적층)
-- 문제: 포인트 할인은 '청구액'에 즉시 반영되지만 실제 차감은 결제 성공(save-order) 시점에 일어난다.
--       동일 회원이 동시에 2건을 결제하면 둘 다 같은 잔액으로 할인받고 차감은 1번만 → 과할인.
-- 해결: 할인 청구가 만들어지는 시점(체크아웃 생성 / 토스 확정 직전)에 포인트를 원자적으로 '예약'.
--       가용 잔액 = 원장 잔액 − 활성(미만료) hold 합. 동시 두 결제가 같은 포인트를 중복 예약 불가.
--       주문 저장 시 hold를 실제 차감(consume)으로 정산하고, 미결제 시 만료/해제로 가용을 복원한다.

CREATE TABLE IF NOT EXISTS public.point_holds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount > 0),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released')),
  ref         TEXT,            -- 게이트웨이 식별자(holdRef / toss paymentKey) — 정산 매칭·멱등용
  order_id    UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_point_holds_active ON public.point_holds(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_point_holds_ref    ON public.point_holds(ref)     WHERE status = 'active';

ALTER TABLE public.point_holds ENABLE ROW LEVEL SECURITY;
-- RLS 정책을 두지 않아 anon/auth 클라이언트는 접근 불가. service-role(RPC)만 조작한다.

-- 1) 가용 잔액 = 원장 잔액(031) − 활성·미만료 hold 합
CREATE OR REPLACE FUNCTION public.get_available_points(p_user UUID)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT GREATEST(0,
    public.get_points_balance(p_user)
    - COALESCE((SELECT SUM(amount) FROM public.point_holds
                 WHERE user_id = p_user AND status = 'active' AND expires_at > NOW()), 0)
  )::INTEGER;
$$;
REVOKE ALL ON FUNCTION public.get_available_points(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_points(UUID) TO service_role;

-- 2) 포인트 예약 — 유저별 advisory lock으로 직렬화. 가용 한도 내에서만 예약하고 실제 예약량 반환.
CREATE OR REPLACE FUNCTION public.hold_points(
  p_user UUID, p_amount INTEGER, p_ref TEXT, p_minutes INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_avail INTEGER;
  v_hold  INTEGER;
  v_exist INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN 0; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_user::TEXT));

  -- 같은 ref로 이미 활성 hold가 있으면 그대로 반환(체크아웃 재시도 멱등 — 중복 예약 방지)
  IF p_ref IS NOT NULL THEN
    SELECT SUM(amount) INTO v_exist FROM public.point_holds
     WHERE ref = p_ref AND status = 'active' AND expires_at > NOW();
    IF COALESCE(v_exist, 0) > 0 THEN RETURN v_exist; END IF;
  END IF;

  SELECT public.get_points_balance(p_user)
       - COALESCE((SELECT SUM(amount) FROM public.point_holds
                    WHERE user_id = p_user AND status = 'active' AND expires_at > NOW()), 0)
    INTO v_avail;

  v_hold := LEAST(p_amount, GREATEST(v_avail, 0));
  IF v_hold <= 0 THEN RETURN 0; END IF;

  INSERT INTO public.point_holds(user_id, amount, status, ref, expires_at)
  VALUES (p_user, v_hold, 'active', p_ref, NOW() + (p_minutes || ' minutes')::INTERVAL);

  RETURN v_hold;
END $$;
REVOKE ALL ON FUNCTION public.hold_points(UUID, INTEGER, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hold_points(UUID, INTEGER, TEXT, INTEGER) TO service_role;

-- 3) 정산 — 해당 ref의 hold를 consumed 처리하고 실제 포인트를 FIFO로 차감(만료 제외). 실제 차감액 반환.
CREATE OR REPLACE FUNCTION public.consume_hold(
  p_user UUID, p_ref TEXT, p_amount INTEGER, p_order UUID,
  p_type TEXT DEFAULT 'spend', p_note TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_avail INTEGER;
  v_spend INTEGER;
  v_left  INTEGER;
  lot     RECORD;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user::TEXT));

  -- 해당 ref의 활성 hold 정산 표시(있으면) — 가용에서 더는 빼지 않도록
  IF p_ref IS NOT NULL THEN
    UPDATE public.point_holds SET status = 'consumed', order_id = p_order
     WHERE ref = p_ref AND status = 'active';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN 0; END IF;

  -- FIFO 실제 차감 (만료되지 않은 로트, 오래된 것부터)
  SELECT COALESCE(SUM(remaining), 0)::INTEGER INTO v_avail
    FROM public.point_transactions
   WHERE user_id = p_user AND amount > 0 AND remaining > 0
     AND (expires_at IS NULL OR expires_at > NOW());

  v_spend := LEAST(p_amount, v_avail);
  IF v_spend <= 0 THEN RETURN 0; END IF;

  v_left := v_spend;
  FOR lot IN
    SELECT id, remaining FROM public.point_transactions
     WHERE user_id = p_user AND amount > 0 AND remaining > 0
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at ASC, id ASC
  LOOP
    EXIT WHEN v_left <= 0;
    IF lot.remaining <= v_left THEN
      UPDATE public.point_transactions SET remaining = 0 WHERE id = lot.id;
      v_left := v_left - lot.remaining;
    ELSE
      UPDATE public.point_transactions SET remaining = remaining - v_left WHERE id = lot.id;
      v_left := 0;
    END IF;
  END LOOP;

  INSERT INTO public.point_transactions(user_id, amount, type, order_id, note, remaining, expires_at)
  VALUES (p_user, -v_spend, COALESCE(p_type, 'spend'), p_order, p_note, NULL, NULL);

  RETURN v_spend;
END $$;
REVOKE ALL ON FUNCTION public.consume_hold(UUID, TEXT, INTEGER, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_hold(UUID, TEXT, INTEGER, UUID, TEXT, TEXT) TO service_role;

-- 4) 해제 — 결제 거부·취소 시 ref의 활성 hold를 released 처리(가용 즉시 복원)
CREATE OR REPLACE FUNCTION public.release_hold(p_ref TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_n INTEGER;
BEGIN
  IF p_ref IS NULL THEN RETURN 0; END IF;
  UPDATE public.point_holds SET status = 'released' WHERE ref = p_ref AND status = 'active';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $$;
REVOKE ALL ON FUNCTION public.release_hold(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_hold(TEXT) TO service_role;

-- 5) 만료 정리(cron) — 미결제로 만료된 활성 hold를 released 처리.
--    (가용 함수가 expires_at로 이미 제외하므로 가용은 cron과 무관하게 항상 정확. 본 잡은 정리용.)
CREATE OR REPLACE FUNCTION public.expire_point_holds()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_n INTEGER;
BEGIN
  UPDATE public.point_holds SET status = 'released'
   WHERE status = 'active' AND expires_at <= NOW();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $$;
REVOKE ALL ON FUNCTION public.expire_point_holds() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_point_holds() TO service_role;
