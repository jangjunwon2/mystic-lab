-- ============================================================
-- Mystic Lab — Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS: users see/edit only their own profile; admins see all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'card_magic', 'coin_magic', 'stage_magic',
    'mentalism', 'electronic', 'accessories'
  )),
  price_usd NUMERIC(10,2) NOT NULL CHECK (price_usd >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  demo_video_cloudflare_id TEXT,
  thumbnail_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public: read active products
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Admin: full access
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PRODUCT TRANSLATIONS
-- ============================================================
CREATE TABLE public.product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en','ko','ja','zh-CN','es','fr','de')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, language)
);

ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product translations"
  ON public.product_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.product_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SOLUTION VIDEOS (해법 영상 — 접근 제어 대상)
-- ============================================================
CREATE TABLE public.solution_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cloudflare_stream_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

ALTER TABLE public.solution_videos ENABLE ROW LEVEL SECURITY;

-- NOTE: "Members can view purchased solution videos" policy is added
-- AFTER orders + order_items tables are created (see below).

CREATE POLICY "Admins can manage solution videos"
  ON public.solution_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PRODUCT UNLOCK CODES (비회원 장비 비밀번호)
-- ============================================================
CREATE TABLE public.product_unlock_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash of the physical code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_used_at TIMESTAMPTZ
);

ALTER TABLE public.product_unlock_codes ENABLE ROW LEVEL SECURITY;

-- No direct select allowed — only through API route (server-side)
-- API route will use service role key to check codes
CREATE POLICY "Service role only"
  ON public.product_unlock_codes FOR ALL
  USING (false);  -- All access via service role key in API routes

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'refunded')),
  total_usd NUMERIC(10,2) NOT NULL CHECK (total_usd >= 0),
  stripe_payment_intent_id TEXT UNIQUE,
  paypal_order_id TEXT UNIQUE,
  customer_email TEXT NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_usd NUMERIC(10,2) NOT NULL CHECK (price_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON public.order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- solution_videos RLS: requires orders + order_items to exist first
CREATE POLICY "Members can view purchased solution videos"
  ON public.solution_videos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.order_items oi ON oi.order_id = o.id
        WHERE o.user_id = auth.uid()
          AND oi.product_id = solution_videos.product_id
          AND o.status IN ('paid', 'shipped', 'completed')
      )
    )
  );

-- ============================================================
-- CUSTOM ORDER REQUESTS (커스텀 도구 의뢰)
-- ============================================================
CREATE TABLE public.custom_order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  desired_deadline DATE,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','reviewing','quoted','in_progress','completed','rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_order_requests ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit inquiry)
CREATE POLICY "Anyone can submit custom order"
  ON public.custom_order_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can view/manage
CREATE POLICY "Admins can manage custom orders"
  ON public.custom_order_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create reviews for purchased products"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.user_id = auth.uid()
        AND oi.product_id = reviews.product_id
        AND o.status IN ('paid', 'shipped', 'completed')
    )
  );

CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER (자동 updated_at 갱신)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_order_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- INDEXES (성능 최적화)
-- ============================================================
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_product_translations_product_lang ON public.product_translations(product_id, language);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);

-- ============================================================
-- SAMPLE DATA (초기 테스트용 — 나중에 삭제 가능)
-- ============================================================
INSERT INTO public.products (slug, category, price_usd, stock, is_featured, is_active)
VALUES
  ('phantom-deck', 'card_magic', 120.00, 50, true, true),
  ('neural-link', 'electronic', 340.00, 10, true, true),
  ('shadow-coin', 'coin_magic', 95.00, 30, true, true),
  ('mind-vault', 'mentalism', 185.00, 20, false, true),
  ('prism-silk', 'stage_magic', 220.00, 15, false, true);

INSERT INTO public.product_translations (product_id, language, name, short_description, description)
SELECT p.id, 'en', t.name, t.short_desc, t.description
FROM public.products p
JOIN (VALUES
  ('phantom-deck',
   'Phantom Deck',
   'Completely ungimmicked yet impossible card effects',
   '<p>The Phantom Deck redefines what is possible with a standard deck of cards. No gimmicks. No switches. Pure impossibility.</p><ul><li>Works with any borrowed deck</li><li>Fully examinable before and after</li><li>5 killer routines included</li></ul>'),
  ('neural-link',
   'Neural Link',
   'Electronic mentalism device with zero tells',
   '<p>Neural Link is the most sophisticated electronic mentalism tool ever created. Hidden tech, maximum impact.</p><ul><li>Wireless signal up to 30m</li><li>12-hour battery life</li><li>Waterproof casing</li></ul>'),
  ('shadow-coin',
   'Shadow Coin',
   'Award-winning coin gimmick for visual vanishes',
   '<p>Shadow Coin won Best Close-Up Device at FISM 2023. The visual vanish is so clean, spectators immediately demand to inspect your hands.</p>'),
  ('mind-vault',
   'Mind Vault',
   'Professional book test with AI-assisted reveals',
   '<p>Mind Vault combines classic book test methodology with cutting-edge technology for completely hands-free reveals.</p>'),
  ('prism-silk',
   'Prism Silk',
   'Color-changing silk with built-in LED system',
   '<p>A stage classic, reimagined. The Prism Silk features a nano LED array embedded in genuine Japanese silk.</p>')
) AS t(slug, name, short_desc, description) ON p.slug = t.slug;

-- ============================================================
-- 완료!
-- 이 SQL 실행 후 Supabase 대시보드에서 테이블 확인:
-- Table Editor → profiles, products, product_translations...
-- ============================================================
