-- 애널리틱스 페이지 최적화: 일별 방문자수 DB 집계 함수
-- 기존: site_visits 최대 50,000행 전체 전송 → JS 인메모리 집계
-- 이후: DB가 집계 후 최대 30행만 반환
CREATE OR REPLACE FUNCTION analytics_daily_visitors(days_back int DEFAULT 30)
RETURNS TABLE(visit_date text, visitors bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date::text AS visit_date, COUNT(session_id)::bigint AS visitors
  FROM site_visits
  WHERE date >= CURRENT_DATE - days_back
  GROUP BY date
  ORDER BY date;
$$;

REVOKE ALL ON FUNCTION analytics_daily_visitors(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION analytics_daily_visitors(int) TO service_role;
