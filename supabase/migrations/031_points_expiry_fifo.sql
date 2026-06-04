-- 마일리지(포인트) 12개월 FIFO 만료 — 로트 기반 원장으로 전환
-- 적립(양수) 행 = 로트: remaining(미소진 잔량) + expires_at(만료일)
-- 차감(음수) 행 = 소진 기록(remaining/expires_at = NULL)
-- 잔액 = 만료되지 않은 로트의 remaining 합. 차감은 오래된 로트부터(FIFO) 소진.

-- 1) 로트 컬럼 추가
ALTER TABLE public.point_transactions
  ADD COLUMN IF NOT EXISTS remaining   INTEGER,
  ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ;

-- 2) 기존 데이터 백필 (현재 잔액 보존)
--    - 모든 양수 행을 로트로: remaining = amount, expires_at = created_at + 12개월
--    - 기존 음수(소진) 합계를 유저별로 오래된 로트부터 차감해 remaining 반영
DO $$
DECLARE
  r   RECORD;
  lot RECORD;
  v_consume INTEGER;
  v_take    INTEGER;
BEGIN
  UPDATE public.point_transactions
     SET remaining = amount,
         expires_at = created_at + INTERVAL '12 months'
   WHERE amount > 0 AND remaining IS NULL;

  FOR r IN
    SELECT user_id, SUM(amount) AS net_neg
      FROM public.point_transactions
     WHERE amount < 0
     GROUP BY user_id
  LOOP
    v_consume := -r.net_neg; -- 차감할 양(양수)
    FOR lot IN
      SELECT id, remaining
        FROM public.point_transactions
       WHERE user_id = r.user_id AND amount > 0 AND remaining > 0
       ORDER BY created_at ASC, id ASC
    LOOP
      EXIT WHEN v_consume <= 0;
      v_take := LEAST(lot.remaining, v_consume);
      UPDATE public.point_transactions SET remaining = remaining - v_take WHERE id = lot.id;
      v_consume := v_consume - v_take;
    END LOOP;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_point_tx_lot
  ON public.point_transactions(user_id, created_at)
  WHERE amount > 0 AND remaining > 0;

-- 3) 잔액 = 만료 안 된 로트의 remaining 합 (023의 평면 합계를 대체)
CREATE OR REPLACE FUNCTION public.get_points_balance(p_user UUID)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(SUM(remaining), 0)::INTEGER
    FROM public.point_transactions
   WHERE user_id = p_user
     AND amount > 0 AND remaining > 0
     AND (expires_at IS NULL OR expires_at > NOW());
$$;
REVOKE ALL ON FUNCTION public.get_points_balance(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_points_balance(UUID) TO service_role;

-- 4) 적립(로트 생성)
CREATE OR REPLACE FUNCTION public.add_points(
  p_user UUID, p_amount INTEGER, p_type TEXT,
  p_order UUID, p_note TEXT, p_expires_months INTEGER DEFAULT 12
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN; END IF;
  INSERT INTO public.point_transactions(user_id, amount, type, order_id, note, remaining, expires_at)
  VALUES (
    p_user, p_amount, COALESCE(p_type, 'earn'), p_order, p_note, p_amount,
    CASE WHEN p_expires_months IS NULL THEN NULL
         ELSE NOW() + (p_expires_months || ' months')::INTERVAL END
  );
END $$;
REVOKE ALL ON FUNCTION public.add_points(UUID, INTEGER, TEXT, UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_points(UUID, INTEGER, TEXT, UUID, TEXT, INTEGER) TO service_role;

-- 5) 차감(FIFO 소진) — 유저별 advisory lock으로 동시 차감 직렬화. 실제 차감액 반환.
CREATE OR REPLACE FUNCTION public.spend_points(
  p_user UUID, p_amount INTEGER, p_type TEXT, p_order UUID, p_note TEXT
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
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN 0; END IF;

  -- 같은 유저의 동시 차감을 직렬화 (잔액 음수·초과소진 방지)
  PERFORM pg_advisory_xact_lock(hashtext(p_user::TEXT));

  SELECT COALESCE(SUM(remaining), 0)::INTEGER INTO v_avail
    FROM public.point_transactions
   WHERE user_id = p_user
     AND amount > 0 AND remaining > 0
     AND (expires_at IS NULL OR expires_at > NOW());

  v_spend := LEAST(p_amount, v_avail);
  IF v_spend <= 0 THEN RETURN 0; END IF;

  v_left := v_spend;
  FOR lot IN
    SELECT id, remaining
      FROM public.point_transactions
     WHERE user_id = p_user
       AND amount > 0 AND remaining > 0
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
REVOKE ALL ON FUNCTION public.spend_points(UUID, INTEGER, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_points(UUID, INTEGER, TEXT, UUID, TEXT) TO service_role;

-- 6) 만료 처리(일 1회 cron) — 만료된 로트의 잔량을 0으로, expire 기록 남김.
--    (잔액 함수가 expires_at로 이미 제외하므로 잔액은 cron과 무관하게 항상 정확. 본 함수는 감사·정리용.)
CREATE OR REPLACE FUNCTION public.expire_points()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  lot     RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR lot IN
    SELECT id, user_id, remaining
      FROM public.point_transactions
     WHERE amount > 0 AND remaining > 0
       AND expires_at IS NOT NULL AND expires_at <= NOW()
  LOOP
    INSERT INTO public.point_transactions(user_id, amount, type, note, remaining, expires_at)
    VALUES (lot.user_id, -lot.remaining, 'expire', '포인트 만료', NULL, NULL);
    UPDATE public.point_transactions SET remaining = 0 WHERE id = lot.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.expire_points() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_points() TO service_role;
