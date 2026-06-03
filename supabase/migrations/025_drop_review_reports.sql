-- 리뷰 신고 기능 제거에 따른 미사용 객체 정리
DROP TABLE IF EXISTS public.review_reports;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS is_reported;
