-- RLS 정책 최적화: auth.uid() → (SELECT auth.uid())
-- 행마다 auth.uid() 재평가를 방지해 대용량 테이블 쿼리 성능 개선
-- Agent DB 감사(2026-06-11) 결과 반영

-- ① orders — SELECT 정책
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- ② wishlists — ALL 정책
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlist"
  ON public.wishlists FOR ALL
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ③ cart_items — ALL 정책
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart"
  ON public.cart_items FOR ALL
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ④ shipping_addresses — ALL 정책
DROP POLICY IF EXISTS "Users manage own shipping addresses" ON public.shipping_addresses;
CREATE POLICY "Users manage own shipping addresses"
  ON public.shipping_addresses FOR ALL
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ⑤ restock_alerts — DELETE 정책
DROP POLICY IF EXISTS "restock_alerts_delete" ON public.restock_alerts;
CREATE POLICY "restock_alerts_delete"
  ON public.restock_alerts FOR DELETE
  USING (
    email = (current_setting('request.jwt.claims', true)::jsonb->>'email')
    OR (SELECT auth.uid()) = user_id
  );

-- ⑥ firmware_releases — USING (true) 제거
-- service_role은 RLS를 우회하므로 별도 정책 없이도 /api/firmware/latest 서버 라우트가 정상 동작함
-- anon/auth 클라이언트의 직접 조회 차단
DROP POLICY IF EXISTS "Service role full access" ON public.firmware_releases;
DROP POLICY IF EXISTS "Public read firmware" ON public.firmware_releases;
