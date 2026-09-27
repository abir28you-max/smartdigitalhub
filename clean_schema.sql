-- =========================================================
-- SMART DIGITAL HUB - COMPLETE DATABASE SCHEMA
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Public can view own role" ON public.user_roles;
CREATE POLICY "Public can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;
CREATE POLICY "Public can read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  long_description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  options JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT,
  delivery_time TEXT,
  brand TEXT DEFAULT 'Smart Digital Hub',
  coupon_code TEXT,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  coupon_option TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Product Coupons Table
CREATE TABLE IF NOT EXISTS public.product_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  option_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read product coupons" ON public.product_coupons;
CREATE POLICY "Public can read product coupons" ON public.product_coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product coupons" ON public.product_coupons;
CREATE POLICY "Admins can manage product coupons" ON public.product_coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read banners" ON public.banners;
CREATE POLICY "Public can read banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Hot Deals Table
CREATE TABLE IF NOT EXISTS public.hot_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hot_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read hot deals" ON public.hot_deals;
CREATE POLICY "Public can read hot deals" ON public.hot_deals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage hot deals" ON public.hot_deals;
CREATE POLICY "Admins can manage hot deals" ON public.hot_deals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_number TEXT,
  account_type TEXT DEFAULT 'personal',
  qr_code_url TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read payment methods" ON public.payment_methods;
CREATE POLICY "Public can read payment methods" ON public.payment_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  transaction_id TEXT,
  sender_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  coupon_code TEXT,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  delivery_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'customer' or 'admin'
  message TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert chat messages" ON public.chat_messages;
CREATE POLICY "Public can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read own session chat" ON public.chat_messages;
CREATE POLICY "Public can read own session chat" ON public.chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage chat messages" ON public.chat_messages;
CREATE POLICY "Admins can manage chat messages" ON public.chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT,
  customer_name TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can create reviews" ON public.reviews;
CREATE POLICY "Public can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. Salami Submissions Table
CREATE TABLE IF NOT EXISTS public.salami_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  bkash_number TEXT NOT NULL,
  note TEXT,
  amount INT NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.salami_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert salami" ON public.salami_submissions;
CREATE POLICY "Public can insert salami" ON public.salami_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage salami" ON public.salami_submissions;
CREATE POLICY "Admins can view and manage salami" ON public.salami_submissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. Coupons Table (General Coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_amount NUMERIC(10,2) NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('product-images', 'product-images', true),
  ('banners', 'banners', true),
  ('avatars', 'avatars', true),
  ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public can read storage objects" ON storage.objects;
CREATE POLICY "Public can read storage objects" ON storage.objects FOR SELECT USING (bucket_id IN ('product-images', 'banners', 'avatars', 'qr-codes'));

DROP POLICY IF EXISTS "Authenticated users can upload storage objects" ON storage.objects;
CREATE POLICY "Authenticated users can upload storage objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('product-images', 'banners', 'avatars', 'qr-codes'));

DROP POLICY IF EXISTS "Authenticated users can update/delete storage objects" ON storage.objects;
CREATE POLICY "Authenticated users can update/delete storage objects" ON storage.objects FOR ALL TO authenticated USING (bucket_id IN ('product-images', 'banners', 'avatars', 'qr-codes'));

-- 16. Trigger for New User -> Profile & Role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SAMPLE INITIAL DATA (Categories & Payment Methods)
-- =========================================================

INSERT INTO public.categories (name, slug, icon) VALUES
  ('AI & Writing Tools', 'ai-tools', 'Sparkles'),
  ('Entertainment & Streaming', 'entertainment', 'Tv'),
  ('Design & Productivity', 'design-tools', 'PenTool'),
  ('Security & VPNs', 'vpns', 'Shield'),
  ('Gaming & Gift Cards', 'gaming', 'Gamepad2'),
  ('Software & Operating Systems', 'software', 'Cpu')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.payment_methods (name, account_number, account_type, instructions, sort_order) VALUES
  ('bKash Personal', '01734698361', 'personal', 'Send Money to this personal number and enter your Transaction ID.', 1),
  ('Nagad Personal', '01734698361', 'personal', 'Send Money to this personal number and enter your Transaction ID.', 2),
  ('Rocket Personal', '01734698361', 'personal', 'Send Money to this personal number and enter your Transaction ID.', 3)
ON CONFLICT DO NOTHING;
