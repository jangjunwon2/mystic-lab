-- Create tutorial_notes table for private user notes mapped to timestamps
CREATE TABLE IF NOT EXISTS public.tutorial_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    timestamp_seconds INT NOT NULL CHECK (timestamp_seconds >= 0),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for tutorial_notes
ALTER TABLE public.tutorial_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tutorial notes" ON public.tutorial_notes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- Create tutorial_tips table for shared magic tips mapped to timestamps
CREATE TABLE IF NOT EXISTS public.tutorial_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    timestamp_seconds INT NOT NULL CHECK (timestamp_seconds >= 0),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    likes_count INT NOT NULL DEFAULT 0
);

-- Enable RLS for tutorial_tips
ALTER TABLE public.tutorial_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all tutorial tips" ON public.tutorial_tips
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own tutorial tips" ON public.tutorial_tips
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for optimized queries
CREATE INDEX IF NOT EXISTS idx_tutorial_notes_user_product ON public.tutorial_notes(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_tips_product ON public.tutorial_tips(product_id);
