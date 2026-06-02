-- shipping_addresses: user can store multiple shipping addresses
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT,
  line1      TEXT NOT NULL DEFAULT '',
  line2      TEXT,
  city       TEXT,
  postal     TEXT,
  country    CHAR(2) NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shipping addresses"
  ON public.shipping_addresses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user to save default_address from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_addr JSONB;
BEGIN
  v_addr := NEW.raw_user_meta_data->'default_address';

  INSERT INTO public.profiles (id, display_name, default_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_addr
  );

  IF v_addr IS NOT NULL
     AND COALESCE(v_addr->>'line1', '') != ''
  THEN
    INSERT INTO public.shipping_addresses (user_id, name, phone, line1, line2, city, postal, country, is_default)
    VALUES (
      NEW.id,
      COALESCE(v_addr->>'name', ''),
      v_addr->>'phone',
      v_addr->>'line1',
      NULLIF(v_addr->>'line2', ''),
      NULLIF(v_addr->>'city', ''),
      NULLIF(v_addr->>'postal', ''),
      UPPER(COALESCE(v_addr->>'country', '')),
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$;
