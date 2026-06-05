-- 할인코드 시스템 폐기 (쿠폰 통합 cleanup) — discount_codes 데이터는 037에서
-- issued_coupons(scope='public')로 백필 완료. 앱 코드는 더 이상 discount_codes를 참조하지 않는다
-- (validate 폴백·save-order·/admin/discounts 제거됨).
-- ⚠️ 선택적: 미실행해도 앱 동작에 지장 없음(미사용 테이블). 완전 정리를 원할 때만 실행.

DROP FUNCTION IF EXISTS public.increment_discount_used(UUID);
DROP TABLE IF EXISTS public.discount_codes;
