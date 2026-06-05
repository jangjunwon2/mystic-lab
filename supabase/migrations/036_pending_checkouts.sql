-- 해외결제(LemonSqueezy) 대기 장바구니 — LS custom 필드 255자 제한 우회용.
-- 체크아웃 생성 시 전체 장바구니·메타를 여기에 저장하고, LS에는 짧은 ref만 넘긴다.
-- 웹훅이 ref로 이 테이블을 조회해 주문을 복원한다(항목 개수 무제한).
-- service-role(admin client)로만 접근(RLS enable + 정책 없음 → anon 차단).

CREATE TABLE IF NOT EXISTS public.pending_checkouts (
  ref        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pending_checkouts ENABLE ROW LEVEL SECURITY;

-- 오래된(미결제 포함) 대기 행 정리용 인덱스. 주기적으로 created_at 기준 purge 가능.
CREATE INDEX IF NOT EXISTS idx_pending_checkouts_created_at
  ON public.pending_checkouts (created_at);
