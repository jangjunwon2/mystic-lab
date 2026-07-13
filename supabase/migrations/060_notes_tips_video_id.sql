-- Add video_id reference to tutorial_notes to map notes to a specific video part
ALTER TABLE public.tutorial_notes 
    ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.solution_videos(id) ON DELETE CASCADE;

-- Add video_id reference to tutorial_tips to map tips to a specific video part
ALTER TABLE public.tutorial_tips 
    ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.solution_videos(id) ON DELETE CASCADE;

-- Create indexes for video-scoped queries on notes and tips
CREATE INDEX IF NOT EXISTS idx_tutorial_notes_video_id ON public.tutorial_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_tips_video_id ON public.tutorial_tips(video_id);
