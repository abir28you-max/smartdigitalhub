
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table (separate from profiles as required)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
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

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Payment methods (admin configurable, public readable for checkout)
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_number TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders (guest checkout)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.payment_methods ADD COLUMN logo_url text DEFAULT NULL;

-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public read for active banners
CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage banners"
ON public.banners FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.hot_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hot_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hot deals"
ON public.hot_deals FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage hot deals"
ON public.hot_deals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
ON public.product_reviews
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete reviews"
ON public.product_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  sender_type text NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  message text NOT NULL,
  customer_name text,
  customer_phone text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (customers send messages)
CREATE POLICY "Anyone can send chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

-- Anyone can read their own session messages (by session_id match)
CREATE POLICY "Anyone can read chat messages"
ON public.chat_messages FOR SELECT
USING (true);

-- Admins can update (mark as read)
CREATE POLICY "Admins can update chat messages"
ON public.chat_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.products ADD COLUMN coupon_code text DEFAULT NULL;

CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);
ALTER TABLE public.payment_methods
ADD COLUMN holder_name text,
ADD COLUMN branch text;
ALTER TABLE public.products ADD COLUMN coupon_discount numeric DEFAULT 0;
NOTIFY pgrst, 'reload schema';
ALTER TABLE public.products ADD COLUMN coupon_option text NULL;
ALTER TABLE public.orders ADD COLUMN delivery_notes jsonb NULL DEFAULT NULL;
ALTER TABLE public.categories ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Add slug column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs from existing product names
UPDATE public.products 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Create function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    new_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_product_slug ON public.products;
CREATE TRIGGER trigger_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_slug();
UPDATE products SET description = '<h2>ChatGPT Plus Subscription in Bangladesh – Instant Delivery | Smart Digital Hub</h2>
<p>At <strong>Smart Digital Hub</strong>, we provide 100% verified and genuine ChatGPT Plus subscription access in Bangladesh with fast, secure, and reliable delivery. Our goal is to make premium AI tools easily accessible for everyone, including students, freelancers, developers, content creators, and professionals.</p>
<p>ChatGPT Plus is one of the most powerful AI tools available today. With a ChatGPT Plus subscription, users get access to faster responses, advanced AI capabilities, and the latest GPT models designed to improve productivity, creativity, and learning.</p>
<p>If you are looking to buy ChatGPT Plus in Bangladesh at an affordable price, Smart Digital Hub is a trusted platform that delivers instantly and ensures a smooth experience for every customer.</p>
<p>Once your payment is successfully completed, your ChatGPT Plus access details will be delivered directly to your registered email instantly or within 2–30 minutes. In some cases, delivery may take up to 2 hours depending on activation requirements.</p>
<h3>What You Will Receive</h3>
<ul>
<li>100% Verified and Genuine ChatGPT Plus Subscription Access</li>
<li>Secure login credentials (Email + Password)</li>
<li>Quick and secure delivery to your email</li>
<li>Instant delivery within 2–5 minutes (maximum 30 minutes to 2 hours)</li>
<li>Personalized access details for each customer</li>
<li>Safe and smooth user experience</li>
</ul>
<p>In some cases we may require your personal email and password to activate the ChatGPT Plus subscription directly on your account to ensure proper activation.</p>
<h3>Why Choose Smart Digital Hub</h3>
<ul>
<li>100% genuine and verified digital products</li>
<li>Fast and secure delivery</li>
<li>Trusted digital service provider in Bangladesh</li>
<li>Affordable pricing</li>
<li>Professional customer support</li>
<li>Instant access to premium AI tools</li>
</ul>
<h3>Important Instructions</h3>
<ul>
<li>The access details sent to your email are strictly for personal use</li>
<li>Do not modify, change, or share your login credentials</li>
<li>If account information is altered or shared, access may be disabled</li>
<li>Smart Digital Hub monitors unauthorized activity to ensure user security</li>
</ul>
<h3>Customer Support</h3>
<p>If you face any issue or delay, please contact our support team.</p>
<p>Email: hello@sagor.pro.bd</p>
<p>WhatsApp: https://wa.me/+8801322230857</p>
<p>Order now and enjoy instant access to ChatGPT Plus subscription in Bangladesh from Smart Digital Hub.</p>' WHERE id = '2c46ff85-d929-4f0d-af75-176c64bba7ca';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS focus_keywords text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS delivery_time text,
  ADD COLUMN IF NOT EXISTS brand text DEFAULT 'Smart Digital Hub';
UPDATE products SET 
  name = TRIM(name),
  slug = LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')))
WHERE slug IS NULL OR slug = '' OR slug ~ '-$' OR slug ~ '^-' OR name != TRIM(name);
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE TABLE public.salami_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bkash_number text NOT NULL UNIQUE,
  name text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.salami_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert salami submissions" ON public.salami_submissions
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read own submission by bkash" ON public.salami_submissions
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage salami" ON public.salami_submissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE public.salami_submissions ADD COLUMN is_completed boolean NOT NULL DEFAULT false;
-- 1. chat_messages: remove public read
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.chat_messages;

CREATE POLICY "Admins can read chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_chat_messages(p_session_id text)
RETURNS TABLE (id uuid, sender_type text, message text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.sender_type, m.message, m.created_at
  FROM public.chat_messages m
  WHERE m.session_id = p_session_id
    AND length(p_session_id) >= 20
  ORDER BY m.created_at ASC
$$;

REVOKE ALL ON FUNCTION public.get_chat_messages(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_messages(text) TO anon, authenticated, service_role;

-- 2. salami_submissions: remove public read
DROP POLICY IF EXISTS "Anyone can read own submission by bkash" ON public.salami_submissions;

CREATE OR REPLACE FUNCTION public.salami_number_exists(p_bkash_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salami_submissions s
    WHERE s.bkash_number = p_bkash_number
  )
$$;

REVOKE ALL ON FUNCTION public.salami_number_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salami_number_exists(text) TO anon, authenticated, service_role;
-- 1) Fix mutable search_path
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    new_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Lock down internal SECURITY DEFINER / trigger functions from direct API execution
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_product_slug() FROM PUBLIC, anon, authenticated;

-- 3) Payment methods: stop exposing account_number / holder_name / branch publicly
DROP POLICY IF EXISTS "Public can read active payment methods" ON public.payment_methods;

CREATE OR REPLACE VIEW public.payment_methods_public AS
  SELECT id, name, logo_url, instructions, is_active, created_at
  FROM public.payment_methods
  WHERE is_active = true;

GRANT SELECT ON public.payment_methods_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_payment_account(p_id uuid)
RETURNS TABLE(account_number text, holder_name text, branch text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.account_number, p.holder_name, p.branch
  FROM public.payment_methods p
  WHERE p.id = p_id AND p.is_active = true
$function$;

REVOKE ALL ON FUNCTION public.get_payment_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_account(uuid) TO anon, authenticated;

-- 4) Replace always-true write policies with validated ones
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create valid orders" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(customer_name)) BETWEEN 1 AND 100
  AND length(btrim(customer_phone)) BETWEEN 6 AND 20
  AND (customer_email IS NULL OR length(customer_email) <= 254)
  AND (transaction_id IS NULL OR length(transaction_id) <= 100)
  AND (coupon_code IS NULL OR length(coupon_code) <= 50)
  AND total_price >= 0
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) BETWEEN 1 AND 50
  AND status = 'pending'
  AND delivery_notes IS NULL
);

DROP POLICY IF EXISTS "Anyone can send chat messages" ON public.chat_messages;
CREATE POLICY "Customers can send chat messages" ON public.chat_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 20 AND 100
  AND sender_type IN ('customer', 'system')
  AND length(message) BETWEEN 1 AND 8000000
  AND (customer_name IS NULL OR length(customer_name) <= 100)
  AND (customer_phone IS NULL OR length(customer_phone) <= 20)
  AND is_read = false
);

CREATE POLICY "Admins can send chat messages" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.product_reviews;
CREATE POLICY "Anyone can create valid reviews" ON public.product_reviews
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(reviewer_name)) BETWEEN 1 AND 60
  AND rating BETWEEN 1 AND 5
  AND length(btrim(review_text)) BETWEEN 1 AND 2000
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id)
);

DROP POLICY IF EXISTS "Anyone can insert salami submissions" ON public.salami_submissions;
CREATE POLICY "Anyone can insert valid salami submissions" ON public.salami_submissions
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(bkash_number)) BETWEEN 11 AND 15
  AND (name IS NULL OR length(name) <= 100)
  AND (note IS NULL OR length(note) <= 500)
  AND is_completed = false
);

-- 5) Public bucket should not be listable
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP VIEW IF EXISTS public.payment_methods_public;

CREATE OR REPLACE FUNCTION public.get_payment_methods()
RETURNS TABLE(id uuid, name text, logo_url text, instructions text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.logo_url, p.instructions
  FROM public.payment_methods p
  WHERE p.is_active = true
  ORDER BY p.created_at
$function$;

REVOKE ALL ON FUNCTION public.get_payment_methods() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_methods() TO anon, authenticated;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
-- Grant EXECUTE on has_role to authenticated so authenticated-only RLS policies can evaluate it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Fix admin policies that incorrectly applied to all roles (should be authenticated only)
-- This caused anonymous requests to fail with "permission denied for function has_role"
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage hot deals" ON public.hot_deals;
CREATE POLICY "Admins can manage hot deals" ON public.hot_deals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.product_reviews;
CREATE POLICY "Admins can delete reviews" ON public.product_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update chat messages" ON public.chat_messages;
CREATE POLICY "Admins can update chat messages" ON public.chat_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TABLE public.product_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  option_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_coupons_product ON public.product_coupons(product_id);
CREATE INDEX idx_product_coupons_code ON public.product_coupons(lower(code));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_coupons TO authenticated;
GRANT ALL ON public.product_coupons TO service_role;

ALTER TABLE public.product_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product coupons"
ON public.product_coupons FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_coupons_updated_at
BEFORE UPDATE ON public.product_coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public lookup of a coupon code without exposing the whole coupon list
CREATE OR REPLACE FUNCTION public.get_product_coupons_by_code(p_code text)
RETURNS TABLE(product_id uuid, discount_amount numeric, option_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.product_id, c.discount_amount, c.option_name
  FROM public.product_coupons c
  WHERE c.is_active = true
    AND lower(c.code) = lower(btrim(p_code))
    AND length(btrim(p_code)) > 0
$$;

GRANT EXECUTE ON FUNCTION public.get_product_coupons_by_code(text) TO anon, authenticated;

-- Migrate existing single super-coupons into the new table
INSERT INTO public.product_coupons (product_id, code, discount_amount, option_name)
SELECT id, coupon_code, COALESCE(coupon_discount, 0), coupon_option
FROM public.products
WHERE coupon_code IS NOT NULL AND btrim(coupon_code) <> '';
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_telegram_message_id_key ON public.orders (telegram_message_id) WHERE telegram_message_id IS NOT NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;

DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN SELECT id, name FROM public.categories WHERE slug IS NULL OR slug = '' LOOP
    base_slug := lower(regexp_replace(rec.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    IF base_slug = '' THEN
      base_slug := 'category';
    END IF;

    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.categories WHERE slug = new_slug AND id != rec.id) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE public.categories SET slug = new_slug WHERE id = rec.id;
  END LOOP;
END $$;

ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

GRANT SELECT ON public.categories TO anon, authenticated;
-- =========================================================
-- 1. Least-privilege table grants (RLS was the only gate)
-- =========================================================

-- chat_messages: anon may only INSERT (reads go through get_chat_messages RPC)
REVOKE ALL ON TABLE public.chat_messages FROM anon, authenticated;
GRANT INSERT ON TABLE public.chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated;
GRANT ALL ON TABLE public.chat_messages TO service_role;

-- orders: no anon access at all (checkout requires sign-in; tracking uses an edge function)
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;

-- product_coupons: admin-only table, reads for checkout go through the RPC
REVOKE ALL ON TABLE public.product_coupons FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_coupons TO authenticated;
GRANT ALL ON TABLE public.product_coupons TO service_role;

-- =========================================================
-- 2. chat_messages: require an unguessable (UUID) session id
-- =========================================================

DROP POLICY IF EXISTS "Customers can send chat messages" ON public.chat_messages;
CREATE POLICY "Customers can send chat messages"
ON public.chat_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND sender_type = ANY (ARRAY['customer'::text, 'system'::text])
  AND length(message) >= 1 AND length(message) <= 8000000
  AND (customer_name IS NULL OR length(customer_name) <= 100)
  AND (customer_phone IS NULL OR length(customer_phone) <= 20)
  AND is_read = false
);

CREATE OR REPLACE FUNCTION public.get_chat_messages(p_session_id text)
 RETURNS TABLE(id uuid, sender_type text, message text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.id, m.sender_type, m.message, m.created_at
  FROM public.chat_messages m
  WHERE m.session_id = p_session_id
    AND p_session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ORDER BY m.created_at ASC
$function$;

-- =========================================================
-- 3. orders: signed-in ownership on insert + no full old-row replication
-- =========================================================

DROP POLICY IF EXISTS "Anyone can create valid orders" ON public.orders;
CREATE POLICY "Signed-in users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND length(btrim(customer_name)) BETWEEN 1 AND 100
  AND length(btrim(customer_phone)) BETWEEN 6 AND 20
  AND (customer_email IS NULL OR length(customer_email) <= 254)
  AND (transaction_id IS NULL OR length(transaction_id) <= 100)
  AND (coupon_code IS NULL OR length(coupon_code) <= 50)
  AND total_price >= 0
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) BETWEEN 1 AND 50
  AND status = 'pending'
  AND delivery_notes IS NULL
);

ALTER TABLE public.orders REPLICA IDENTITY DEFAULT;

-- =========================================================
-- 4. SECURITY DEFINER functions: revoke PUBLIC, grant precisely
-- =========================================================

REVOKE ALL ON FUNCTION public.get_chat_messages(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.salami_number_exists(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_payment_methods() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_payment_account(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_product_coupons_by_code(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_product_slug() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Public-facing (anonymous visitors legitimately need these)
GRANT EXECUTE ON FUNCTION public.get_chat_messages(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salami_number_exists(text) TO anon, authenticated, service_role;

-- Checkout-only: signed-in customers only
GRANT EXECUTE ON FUNCTION public.get_payment_methods() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_payment_account(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_product_coupons_by_code(text) TO authenticated, service_role;

-- Required by RLS policy evaluation for signed-in users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Trigger-only helpers stay callable by the owner/service role only
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_product_slug() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
DELETE FROM public.orders WHERE customer_name = 'Sec Probe';
DELETE FROM public.chat_messages WHERE message = 'secfix probe';
GRANT EXECUTE ON FUNCTION public.get_product_coupons_by_code(text) TO anon;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_delivery_details boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_details jsonb;
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');
