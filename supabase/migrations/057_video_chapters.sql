-- 해법 영상 타임스탬프 챕터: 특정 구간에 설명을 붙이고 클릭 시 해당 시점으로 이동
-- 챕터는 solution_videos 1개 행(파트)에 종속됨

CREATE TABLE public.video_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.solution_videos(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL CHECK (timestamp_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.video_chapter_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.video_chapters(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en','ko','ja','zh-CN','es','fr','de')),
  description TEXT NOT NULL,
  UNIQUE (chapter_id, language)
);

CREATE INDEX idx_video_chapters_video_id ON public.video_chapters(video_id, timestamp_seconds);
CREATE INDEX idx_video_chapter_translations_chapter_id ON public.video_chapter_translations(chapter_id);

ALTER TABLE public.video_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_chapter_translations ENABLE ROW LEVEL SECURITY;

-- 어드민은 전체 관리
CREATE POLICY "Admins can manage video chapters"
  ON public.video_chapters FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage video chapter translations"
  ON public.video_chapter_translations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 구매 확인 회원 또는 수동 권한부여 대상은 열람 가능 (solution_videos RLS와 동일한 조건)
CREATE POLICY "Members can view chapters of purchased solution videos"
  ON public.video_chapters FOR SELECT
  USING (
    (SELECT auth.uid()) IS NOT NULL AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.solution_videos sv
        JOIN public.orders o ON o.user_id = (SELECT auth.uid())
        JOIN public.order_items oi ON oi.order_id = o.id AND oi.product_id = sv.product_id
        WHERE sv.id = video_chapters.video_id
          AND o.status IN ('paid', 'shipped', 'completed')
      )
      OR EXISTS (
        SELECT 1 FROM public.solution_videos sv
        JOIN public.manual_video_grants mvg ON mvg.product_id = sv.product_id AND mvg.user_id = (SELECT auth.uid())
        WHERE sv.id = video_chapters.video_id
          AND (mvg.expires_at IS NULL OR mvg.expires_at > NOW())
      )
    )
  );

CREATE POLICY "Members can view chapter translations of purchased solution videos"
  ON public.video_chapter_translations FOR SELECT
  USING (
    (SELECT auth.uid()) IS NOT NULL AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.video_chapters vc
        JOIN public.solution_videos sv ON sv.id = vc.video_id
        JOIN public.orders o ON o.user_id = (SELECT auth.uid())
        JOIN public.order_items oi ON oi.order_id = o.id AND oi.product_id = sv.product_id
        WHERE vc.id = video_chapter_translations.chapter_id
          AND o.status IN ('paid', 'shipped', 'completed')
      )
      OR EXISTS (
        SELECT 1 FROM public.video_chapters vc
        JOIN public.solution_videos sv ON sv.id = vc.video_id
        JOIN public.manual_video_grants mvg ON mvg.product_id = sv.product_id AND mvg.user_id = (SELECT auth.uid())
        WHERE vc.id = video_chapter_translations.chapter_id
          AND (mvg.expires_at IS NULL OR mvg.expires_at > NOW())
      )
    )
  );
