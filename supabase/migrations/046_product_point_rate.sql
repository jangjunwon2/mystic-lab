-- 상품별 포인트 적립률 오버라이드.
-- NULL이면 site_settings의 전역 적립률을 사용한다.
ALTER TABLE products ADD COLUMN IF NOT EXISTS point_earn_rate numeric(5,4);
