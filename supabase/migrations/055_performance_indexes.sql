-- 성능 인덱스 추가 및 만료 데이터 정리
-- Agent DB 감사(2026-06-11) 결과 반영

-- 1. orders 테이블 인덱스 (날짜 범위 쿼리, 이메일 조회, RLS 서브쿼리)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders(customer_email);

-- solution_videos RLS에서 user_id + status 조합으로 자주 조회됨
CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON public.orders(user_id, status)
  WHERE status IN ('paid', 'shipped', 'completed');

-- 2. wishlists 인덱스 (user_id는 UNIQUE 제약으로 커버되나 product_id 단독 없음)
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id
  ON public.wishlists(product_id);

-- 3. product_views 인덱스 + 90일 이상 된 행 정리
CREATE INDEX IF NOT EXISTS idx_product_views_product_viewed
  ON public.product_views(product_id, viewed_at DESC);

DELETE FROM public.product_views
  WHERE viewed_at < NOW() - INTERVAL '90 days';

-- 4. pending_checkouts 만료 행 정리 (7일 이상)
DELETE FROM public.pending_checkouts
  WHERE created_at < NOW() - INTERVAL '7 days';

-- 5. issued_coupons 공개 활성 쿠폰 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_issued_coupons_active_public
  ON public.issued_coupons(code)
  WHERE scope = 'public' AND is_active = true;
