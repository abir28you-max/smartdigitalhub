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


-- =========================================================
-- RESTORE ALL 38 PRODUCTS & CATEGORIES
-- =========================================================

-- 1. Categories
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('bec5317f-1180-4eae-ae4b-bd4466f97f7f', 'Education Tools', 'education-tools', 'Book', 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('aa60119c-36ba-4d4d-86ad-81398157b99d', 'Editing Tools', 'editing-tools', 'pen', 3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('30dbadb7-522a-4603-b876-ab725420529b', 'VPN', 'vpn', 'shield', 6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('c6ed888d-013d-477f-bbc8-1cef8c71557e', 'Entertainment', 'entertainment', 'tv', 7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('fcac0671-0e51-45cb-9e53-d37d1ccadda1', 'Gameing', 'gameing', 'Gamepad', 8) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('aba13ade-44a6-4fb7-8ca1-d9b715fbfbe1', 'Social', 'social', 'share', 9) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('8fbbf2a8-fd99-443e-b039-c6be06bb8927', 'Card Payment', 'card-payment', 'Creditcard', 10) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('11fd015b-cb40-4e05-b161-cdcb9a2b8b83', 'Software For PC', 'software-for-pc', 'monitor', 9) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('f605ef4f-2f0f-413c-a552-705e94d99d6a', 'Vibe Codeing', 'vibe-codeing', 'code', 1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;
INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES ('361e49ce-0c40-4dc1-bb62-557fde153e01', 'Ai Tools', 'ai-tools', 'bot', 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;

-- 2. Products
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '2c46ff85-d929-4f0d-af75-176c64bba7ca',
  'ChatGPT ',
  'chatgpt',
  '<h2>ChatGPT Plus Subscription in Bangladesh – Instant Delivery | Smart Digital Hub</h2>
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
<p>Order now and enjoy instant access to ChatGPT Plus subscription in Bangladesh from Smart Digital Hub.</p>',
  'Unlock 1 month of ChatGPT Plus for advanced AI features. Instant delivery by Smart Digital Hub in Bangladesh.',
  '<h2>Introduction</h2><p>Experience the future of AI with ChatGPT Plus, now available through Smart Digital Hub. Get instant access to the most advanced AI models for a full month, enhancing your productivity, creativity, and problem-solving capabilities. Whether you''re a student, freelancer, developer, or content creator in Bangladesh, ChatGPT Plus is your ultimate AI companion.</p><h2>What You Will Receive</h2><ul><li><strong>1 Month ChatGPT Plus Subscription:</strong> Enjoy all premium features for 30 days.</li><li><strong>Instant Digital Delivery:</strong> Your access details will be sent to your email within 2-30 minutes.</li><li><strong>Secure & Verified Access:</strong> Guaranteed legitimate access to ChatGPT Plus.</li></ul><h2>Key Features</h2><ul><li><strong>Access to GPT-4:</strong> Leverage the most powerful and intelligent AI model for complex tasks.</li><li><strong>Faster Response Times:</strong> Get quicker and more efficient responses compared to the free version.</li><li><strong>Priority Access:</strong> Even during peak times, you''ll have uninterrupted access to ChatGPT.</li><li><strong>Enhanced Creativity & Productivity:</strong> Generate ideas, write content, debug code, and more with unparalleled efficiency.</li><li><strong>Multilingual Support:</strong> Work effectively in various languages.</li></ul><h2>Why Choose Smart Digital Hub</h2><ul><li><strong>Trusted Service:</strong> We are a verified digital subscription provider in Bangladesh.</li><li><strong>Fast Delivery:</strong> Get your ChatGPT Plus access within minutes.</li><li><strong>Secure Transactions:</strong> Your purchase is safe and protected.</li><li><strong>Dedicated Customer Support:</strong> We''re here to assist you every step of the way.</li><li><strong>Competitive Pricing:</strong> Enjoy premium AI at an affordable price in BD.</li></ul><h2>Important Instructions</h2><ul><li>Please ensure your email address is correct during purchase for smooth delivery.</li><li>Check your spam/junk folder if you don''t receive your access details within 30 minutes.</li><li>This subscription is for 1 month of ChatGPT Plus access.</li></ul><h2>Customer Support</h2><p>For any queries or assistance, please contact us:</p><ul><li><strong>Email:</strong> hello@sagor.pro.bd</li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Don''t miss out! Buy your ChatGPT Plus 1-month subscription today and transform the way you work and create!</strong></p>',
  600,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771517526965.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'in_stock',
  '[{"name":"1 Month Plus","price":1400,"in_stock":true,"warranty":"none"},{"name":"1 Month Shared","price":800,"in_stock":true,"warranty":"full"},{"name":"1 Month business Perosnal","price":900,"in_stock":true,"warranty":"hide"},{"name":"2 month Business ","price":1500,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Buy ChatGPT Plus 1 Month – Smart Digital Hub Official',
  'Unlock the power of ChatGPT Plus for 1 month! Get instant access to advanced AI features for writing, coding, and more. Trusted service in Bangladesh.',
  'ChatGPT Plus, buy ChatGPT Bangladesh, ChatGPT subscription BD, AI tools Bangladesh, premium AI access',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '1239befc-4218-40e6-8c6e-08576fcaf900',
  'Windows 10/11 Products Key',
  'windows-key',
  'Windows 10/11 Original products keys. 1 device Lifetime activated. Original Products',
  'Get a genuine Windows 10 or Windows 11 lifetime product key for 1 PC with instant digital delivery.',
  '<div class="product-description">
    <h2>Windows 10/11 Lifetime Product Key for 1 PC</h2>
    <p>Unlock the full potential of your PC with a genuine <strong>Windows 10 or Windows 11 lifetime product key</strong>. At Smart Digital Hub, we provide authentic digital licenses that ensure stable performance, robust security, and access to all the latest features and updates from Microsoft. Perfect for students, freelancers, developers, content creators, and professionals in Bangladesh seeking a reliable operating system solution.</p>

    <h3>What You Will Receive</h3>
    <ul>
        <li><strong>1x Lifetime Product Key:</strong> A unique, genuine digital license for either Windows 10 or Windows 11 (Pro/Home, depending on selection).</li>
        <li><strong>Instant Digital Delivery:</strong> Your product key will be delivered directly to your email within 2-30 minutes of purchase.</li>
        <li><strong>Installation Guide:</strong> Simple instructions to help you activate your Windows operating system seamlessly.</li>
        <li><strong>24/7 Customer Support:</strong> Assistance via email and WhatsApp for any queries or issues.</li>
    </ul>

    <h3>Key Features</h3>
    <ul>
        <li><strong>Genuine License:</strong> Get a 100% authentic, verifiable product key directly from Microsoft''s distribution channels.</li>
        <li><strong>Lifetime Validity:</strong> Activate once and enjoy Windows indefinitely on a single PC.</li>
        <li><strong>Full Functionality:</strong> Access all features, security updates, and future upgrades for your chosen Windows version.</li>
        <li><strong>Enhanced Security:</strong> Benefit from advanced protection against viruses, malware, and other threats.</li>
        <li><strong>Optimized Performance:</strong> Experience a stable and efficient operating system for all your computing needs.</li>
        <li><strong>Multi-Purpose Use:</strong> Ideal for personal, educational, or professional use, supporting a wide range of software and applications.</li>
    </ul>

    <h3>Why Choose Smart Digital Hub</h3>
    <ul>
        <li><strong>Trusted Provider:</strong> We are a verified digital subscription service in Bangladesh, known for reliability.</li>
        <li><strong>Fast & Secure Delivery:</strong> Get your product key quickly and securely to your inbox.</li>
        <li><strong>Competitive Pricing:</strong> Enjoy affordable prices without compromising on authenticity.</li>
        <li><strong>Dedicated Support:</strong> Our expert team is always ready to assist you with any activation or technical issues.</li>
        <li><strong>Customer Satisfaction:</strong> We prioritize your experience, ensuring a smooth purchase and activation process.</li>
        <li><strong>Authenticity Guaranteed:</strong> Every key is genuine and directly sourced, ensuring legal and lasting activation.</li>
    </ul>

    <h3>Important Instructions</h3>
    <p>After purchase, please check your email (including spam/junk folders) for the product key and activation guide. Ensure your PC meets the minimum requirements for Windows 10 or Windows 11 before attempting activation. For new installations, you can download the official Windows ISO from Microsoft''s website.</p>

    <h3>Customer Support</h3>
    <p>For any questions or assistance, please reach out to us:</p>
    <ul>
        <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
        <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
    </ul>

    <h3>Call To Action</h3>
    <p><strong>Don''t compromise on your PC''s performance and security. Get your genuine Windows 10/11 lifetime product key today from Smart Digital Hub and experience the difference!</strong></p>
</div>',
  400,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1788595089264.jpg',
  '11fd015b-cb40-4e05-b161-cdcb9a2b8b83',
  'in_stock',
  '[{"name":"Lifetime 1 PC","price":400,"in_stock":true,"warranty":"full"}]'::jsonb,
  'Windows 10/11 Lifetime Product Key BD | Instant Delivery',
  'Get genuine Windows 10/11 Pro/Home lifetime product keys in Bangladesh. Instant digital delivery & secure access guaranteed by Smart Digital Hub. Shop now!',
  'Windows 10 key, Windows 11 key, Windows lifetime key, genuine Windows BD, buy Windows key Bangladesh, Windows product key, Smart Digital Hub Windows, Windows license, instant Windows key, Windows 10 Pro key',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '0acc4f92-ab85-4dcc-8d84-57cc4bae15c2',
  'Leonardo Ai',
  'leonardo-ai',
  'Leonardo AI (Maestro Unlimited) -100% Authentic and Genuine Subscription. ',
  'Get a 1-month premium personal Leonardo AI account instantly from Smart Digital Hub for creative AI art and design.',
  '<h2>Introduction</h2><p>Unleash your creativity and transform your ideas into stunning visuals with a <strong>1-month personal Leonardo AI premium account</strong>, exclusively available through Smart Digital Hub. Leonardo AI is a leading generative AI platform that empowers users to create breathtaking art, designs, and images with unparalleled ease and precision. Whether you''re a student, freelancer, developer, or content creator in Bangladesh, this premium subscription opens up a world of artistic possibilities.</p><h2>What You Will Receive</h2><ul><li>A brand new personal Leonardo AI account with 1-month premium access.</li><li>Full features and benefits of the premium subscription.</li><li>Instant access details upon successful purchase.</li></ul><h2>Key Features</h2><ul><li><strong>Advanced AI Generation:</strong> Create high-quality images, illustrations, and art with powerful AI algorithms.</li><li><strong>Custom Model Training:</strong> Train your own AI models with your unique data to achieve personalized results.</li><li><strong>Intuitive Interface:</strong> Easy-to-use platform suitable for both beginners and experienced artists.</li><li><strong>Commercial Use:</strong> Generate content for personal and commercial projects without restrictions.</li><li><strong>Fast & Efficient Workflow:</strong> Optimize your creative process with quick rendering and diverse artistic styles.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>As a trusted digital subscription service provider in Bangladesh, Smart Digital Hub is committed to delivering a seamless and secure experience. When you choose us, you benefit from:</p><ul><li><strong>Verified Service:</strong> We provide legitimate and verified premium accounts.</li><li><strong>Instant Delivery:</strong> Get immediate access to your Leonardo AI account after purchase.</li><li><strong>Secure Transactions:</strong> Your payment information is protected with advanced security protocols.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you every step of the way.</li><li><strong>Competitive Pricing:</strong> Enjoy premium AI tools at affordable rates tailored for the Bangladeshi market.</li></ul><h2>Important Instructions</h2><p>After your purchase, you will receive an email with your Leonardo AI account credentials and easy-to-follow activation instructions. Please ensure you provide a valid email address during checkout for instant delivery.</p><h2>Customer Support</h2><p>For any inquiries or assistance, please don''t hesitate to reach out:</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Transform your creative vision into reality today! Purchase your Leonardo AI premium account from Smart Digital Hub and start creating stunning AI art instantly.</strong></p>',
  400,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771499344304.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'out_of_stock',
  '[{"name":"1 Month Personal 8500 Credit","price":400,"warranty":"hide"}]'::jsonb,
  'Leonardo AI Premium Account - 1 Month Personal',
  'Unlock your creativity with a 1-month personal Leonardo AI premium account from Smart Digital Hub. Instant delivery, secure access, and dedicated support in Bangladesh.',
  'Leonardo AI, AI art generator, AI premium account, Smart Digital Hub, digital subscription BD, AI tools Bangladesh, creative AI, AI for content creators, AI for students, AI for freelancers',
  'instant',
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'a33df3b3-7881-4021-99ff-34a117c48363',
  'Filmora',
  'filmora',
  'Filmora 14 PRO WINDOWS + MAC - 100% Authentic and Genuine Subscription.

A ready-to-use official shared general account for the selected service with an active, prepaid subscription.',
  NULL,
  NULL,
  499,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500777120.png',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'out_of_stock',
  '[{"name":"Filmora 14 Pro","price":499,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '0ef48459-564e-4b2f-917b-fda43dcb24a4',
  'Claude',
  'claude',
  'Claude Ai Pro - 100% Authentic and Genuine Subscription',
  'Get a 1-month personal Claude AI account from Smart Digital Hub for advanced AI capabilities and instant delivery.',
  '<h2>Unlock Advanced AI with Claude AI Account - 1 Month Personal</h2><p>Experience the power of cutting-edge artificial intelligence with a <strong>1-month personal Claude AI account</strong>, exclusively from Smart Digital Hub. Whether you''re a student, freelancer, developer, content creator, or a professional aiming to boost productivity, Claude offers unparalleled capabilities to assist you.</p><h3>What You Will Receive</h3><ul><li>A fully functional, personal Claude AI account with 1-month access.</li><li>Instant digital delivery within 2-30 minutes of purchase.</li><li>Secure and verified access to all Claude features.</li></ul><h3>Key Features</h3><ul><li><strong>Advanced Language Understanding:</strong> Claude excels in comprehending complex queries and generating nuanced responses.</li><li><strong>Content Creation:</strong> Generate high-quality articles, scripts, marketing copy, and more with ease.</li><li><strong>Code Generation & Debugging:</strong> Developers can leverage Claude for writing, debugging, and understanding code snippets.</li><li><strong>Data Analysis & Summarization:</strong> Quickly process and summarize large volumes of information.</li><li><strong>Creative Brainstorming:</strong> Overcome creative blocks with Claude as your intelligent brainstorming partner.</li><li><strong>Personalized Assistance:</strong> Get tailored support for your academic, professional, or personal projects.</li></ul><h3>Why Choose Smart Digital Hub?</h3><p>At Smart Digital Hub, we are committed to providing a seamless and trustworthy experience for our customers in Bangladesh. When you choose us for your Claude AI account, you benefit from:</p><ul><li><strong>Verified Service:</strong> We ensure genuine accounts and secure access.</li><li><strong>Fast Delivery:</strong> Get your Claude account delivered digitally within minutes.</li><li><strong>Competitive Pricing:</strong> Enjoy premium AI access at an affordable price in Bangladesh.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or issues.</li></ul><h3>Important Instructions</h3><p>After your purchase, please check your email for instant delivery instructions. The Claude AI account details will be sent to your registered email address within 2-30 minutes. Ensure you follow the provided steps for activating your personal account.</p><h3>Customer Support</h3><p>For any assistance, feel free to reach out to us:</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h3>Ready to Elevate Your Productivity?</h3><p>Don''t miss out on the opportunity to experience advanced AI. <strong>Buy your 1-month personal Claude AI account today from Smart Digital Hub</strong> and transform the way you work and create!</p>',
  2850,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771499689952.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'in_stock',
  '[{"name":"1 Month Personal","price":2850,"warranty":"hide"}]'::jsonb,
  'Buy Claude AI Account in BD - 1 Month Personal',
  'Unlock advanced AI capabilities with a 1-month personal Claude AI account from Smart Digital Hub. Instant delivery, secure access, and dedicated support for Bangladesh users.',
  'Claude AI, Claude account, buy Claude BD, Claude subscription, AI tools Bangladesh, Smart Digital Hub Claude, Claude personal plan, AI for students, AI for content creators',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '57f79dd9-06a4-446b-9bf4-362434bb90de',
  'Surfshark',
  'surfshark',
  'Surfshark Vpn - 100% Authentic and Genuine Subscription.',
  NULL,
  NULL,
  150,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501003917.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'out_of_stock',
  '[{"name":"1 Month","price":150,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'eaf9191b-89fe-43f0-b72c-7809fcf29e86',
  'HboMax',
  'hbo-max-1-month-profile-bd',
  'Hbo Max Premium - 100% Authentic and Genuine Subscription.',
  'Get instant access to HBO Max in Bangladesh for 1 month with a private profile from Smart Digital Hub.',
  '<h2>Introduction</h2>
<p>Unlock a world of premium entertainment with an HBO Max 1-Month Profile, brought to you by Smart Digital Hub. Dive into an unparalleled streaming experience with exclusive movies, critically acclaimed series, and captivating documentaries that cater to every taste. Whether you''re a student, freelancer, professional, or content creator in Bangladesh, HBO Max offers endless hours of high-quality entertainment.</p>

<h2>What You Will Receive</h2>
<ul>
  <li>A private 1-month HBO Max profile within a shared account.</li>
  <li>Instant digital delivery within 2-30 minutes of purchase.</li>
  <li>Access to all HBO Max content available in your region.</li>
</ul>

<h2>Key Features</h2>
<ul>
  <li><strong>Exclusive Content:</strong> Stream Hollywood blockbusters, Max Originals, and classic HBO series.</li>
  <li><strong>High-Quality Streaming:</strong> Enjoy content in stunning HD and 4K where available.</li>
  <li><strong>Personalized Profile:</strong> Your own dedicated profile ensures a tailored viewing experience and keeps your watchlist organized.</li>
  <li><strong>Multi-Device Access:</strong> Watch on your smartphone, tablet, laptop, smart TV, and gaming consoles.</li>
</ul>

<h2>Why Choose Smart Digital Hub</h2>
<ul>
  <li><strong>Verified Service:</strong> Smart Digital Hub is a trusted provider of digital subscriptions in Bangladesh.</li>
  <li><strong>Instant Delivery:</strong> Get your HBO Max profile delivered digitally within 2-30 minutes.</li>
  <li><strong>Secure Access:</strong> We ensure secure and reliable access to your subscription.</li>
  <li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or concerns.</li>
</ul>

<h2>Important Instructions</h2>
<ul>
  <li>This purchase provides you with a single profile within a shared HBO Max account for one month.</li>
  <li>Do not change account passwords or details. Doing so will void your warranty.</li>
  <li>For any issues, please contact our customer support immediately.</li>
</ul>

<h2>Customer Support</h2>
<p>For any questions or assistance, feel free to reach out to us:</p>
<ul>
  <li>Email: <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
  <li>WhatsApp: <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h2>Call To Action</h2>
<p><strong>Ready to immerse yourself in premium entertainment? Get your HBO Max 1-Month Profile today from Smart Digital Hub and start streaming!</strong></p>',
  350,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502221722.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'out_of_stock',
  '[{"name":"1 Month Profile","price":350,"warranty":"hide"}]'::jsonb,
  'HBO Max 1 Month Profile - Instant BD Delivery',
  'Get instant access to HBO Max in Bangladesh with a 1-month profile from Smart Digital Hub. Stream exclusive movies, series, and more!',
  'HBO Max Bangladesh, HBO Max BD, Buy HBO Max, HBO Max subscription, Smart Digital Hub HBO Max, stream HBO Max, HBO Max plan, HBO Max profile',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '9629f782-e830-46a6-ade5-2ff72f98ccdf',
  'Shutterstock',
  'shutterstock',
  'Shutterstock Premium Service File Download - 100% Authentic and Genuine Subscription. 

Valid for all standart image/vector files',
  NULL,
  NULL,
  299,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500571267.png',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'out_of_stock',
  '[{"name":"1 Month","price":299,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '82d3c13f-2da0-4624-a089-2f07b90b91ae',
  'Hegen',
  'hegen-ai-pro-3-month-subscription',
  'Hey Gen Subscription Unlimited -100% Authentic and Genuine Subscription.
Coupon work 100% coupon no replace o refound.',
  'Unlock 3 months of Hegen AI Pro for advanced productivity, Coupon work 100%, coupon no replace or refound.',
  '<h2>Introduction</h2><p>Experience the power of artificial intelligence with the <strong>Hegen AI Pro 3-Month Subscription</strong>, brought to you by Smart Digital Hub. Designed for students, freelancers, developers, content creators, and professionals in Bangladesh, Hegen AI Pro offers advanced tools to streamline your workflows and enhance productivity.</p><h2>What You Will Receive</h2><p>Upon purchase, you will receive:</p><ul><li>Access to Hegen AI Pro for 3 months</li><li>Instant digital delivery via email (within 2-30 minutes)</li><li>A verified and genuine subscription</li></ul><h2>Key Features</h2><ul><li><strong>Advanced AI Capabilities:</strong> Leverage cutting-edge AI for various tasks.</li><li><strong>Boost Productivity:</strong> Automate repetitive tasks and gain insights faster.</li><li><strong>User-Friendly Interface:</strong> Easy to navigate for all skill levels.</li><li><strong>Dedicated Support:</strong> Get assistance when you need it.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>At Smart Digital Hub, we are committed to providing a seamless and reliable experience:</p><ul><li><strong>Fast Delivery:</strong> Your Hegen AI Pro access is delivered within 2-30 minutes.</li><li><strong>Secure Access:</strong> We ensure your subscription is safe and secure.</li><li><strong>Verified Service:</strong> Trust in our genuine and authorized digital products.</li><li><strong>Customer Support:</strong> Our team is ready to assist you every step of the way.</li></ul><h2>Important Instructions</h2><p>After your purchase, please check your email (including spam/junk folders) for your Hegen AI Pro access details. If you encounter any issues, please contact our support team.</p><h2>Customer Support</h2><p>For any queries or assistance, feel free to reach out:</p><ul><li><strong>Email:</strong> hello@sagor.pro.bd</li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Don''t miss out! Get your Hegen AI Pro 3-Month Subscription today and elevate your digital experience with Smart Digital Hub!</strong></p>',
  300,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771499547237.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'out_of_stock',
  '[{"name":"3 Month Pro","price":1050,"in_stock":false,"warranty":"hide"}]'::jsonb,
  'Hegen AI Pro 3-Month Subscription | Smart Digital Hub',
  'Unlock Hegen AI Pro for 3 months with instant delivery from Smart Digital Hub. Boost your productivity with advanced AI tools, perfect for students, creators & pros in BD.',
  'Hegen AI Pro, Hegen subscription Bangladesh, buy Hegen BD, AI tools Bangladesh, Smart Digital Hub Hegen, digital subscription BD, Hegen 3 month',
  NULL,
  'Smart Digital Hub',
  'HEYTECH',
  500,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '01adebb0-9c33-46f0-a787-63c9ddaa86dc',
  'Proton VPN',
  'proton-vpn-premium-1-month',
  'ProtonVpn - 100% Authentic and Genuine Subscription.✨',
  'Get a 1-month Proton VPN premium account for secure and private internet access in Bangladesh.',
  '<h2>Introduction</h2><p>In today''s digital world, online privacy and security are paramount. Proton VPN offers a robust solution, providing encrypted internet access to protect your data and enhance your online experience. Smart Digital Hub brings you the Proton VPN premium account for 1 month, ensuring you get the best in digital security.</p><h2>What You Will Receive</h2><ul><li>A brand new, unshared Proton VPN premium account with 1-month validity.</li><li>Access to all premium features, including faster speeds, more servers, and advanced security protocols.</li><li>Instant digital delivery to your email within 2-30 minutes.</li></ul><h2>Key Features</h2><ul><li><strong>Strong Encryption:</strong> Protect your online activities with AES-256 encryption.</li><li><strong>Secure Core:</strong> Route your traffic through multiple servers for enhanced security.</li><li><strong>No-Logs Policy:</strong> Your online activities are never logged, ensuring complete privacy.</li><li><strong>High-Speed Servers:</strong> Enjoy fast and stable connections for streaming, gaming, and browsing.</li><li><strong>Bypass Geo-Restrictions:</strong> Access your favorite content from anywhere in the world.</li><li><strong>Multiple Device Support:</strong> Use Proton VPN on various devices simultaneously.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>Smart Digital Hub is your trusted partner for digital subscriptions in Bangladesh. We offer:</p><ul><li><strong>Verified Service:</strong> Genuine premium accounts directly from official sources.</li><li><strong>Fast Delivery:</strong> Get your subscription delivered within minutes.</li><li><strong>Secure Access:</strong> We prioritize your account security.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries.</li><li><strong>Competitive Pricing:</strong> Affordable access to premium digital products.</li></ul><h2>Important Instructions</h2><ul><li>After purchase, you will receive your Proton VPN premium account details via email.</li><li>Please do not share your account details with others to maintain security.</li><li>For any issues or questions, contact our customer support.</li></ul><h2>Customer Support</h2><p>Have questions or need assistance? Our support team is here to help:</p><ul><li>Email: hello@sagor.pro.bd</li><li>WhatsApp: <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Secure your online presence today! Purchase your Proton VPN premium account from Smart Digital Hub and experience true internet freedom and privacy.</strong></p>',
  99,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501303615.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'out_of_stock',
  '[{"name":"1 Month","price":99,"warranty":"hide"}]'::jsonb,
  'Proton VPN Premium Account 1 Month - Smart Digital Hub',
  'Get secure and private internet access with Proton VPN premium for 1 month. Enjoy fast speeds and unblock content in Bangladesh with Smart Digital Hub.',
  'Proton VPN Bangladesh, Proton VPN BD, buy Proton VPN, Proton VPN premium, VPN subscription BD, secure VPN, fast VPN, online privacy Bangladesh',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '3909af6c-6cde-4e06-8d85-d4007610d3e8',
  'IPvanish',
  'buy-ipvanish-vpn-bangladesh',
  'IPvanish Vpn - 100% Authentic and Genuine Subscription.',
  'Get a 1-month IPVanish VPN subscription for secure, private, and fast internet browsing in Bangladesh.',
  '<h2>Introduction</h2>
<p>In today''s digital world, online privacy and security are paramount. IPVanish VPN offers a robust solution to protect your online activities, bypass geo-restrictions, and ensure a fast, secure internet connection. At Smart Digital Hub, we make it easy for you to access this premium VPN service in Bangladesh, with instant digital delivery and trusted support.</p>

<h2>What You Will Receive</h2>
<ul>
    <li>A 1-month IPVanish VPN subscription.</li>
    <li>Secure access to your IPVanish account.</li>
    <li>Comprehensive guide for quick setup and usage.</li>
</ul>

<h2>Key Features</h2>
<ul>
    <li><strong>Strong Encryption:</strong> Protect your data with industry-leading encryption standards.</li>
    <li><strong>Global Server Network:</strong> Access content from anywhere with servers in over 75 locations.</li>
    <li><strong>Fast Speeds:</strong> Enjoy seamless streaming, gaming, and browsing with minimal buffering.</li>
    <li><strong>No-Log Policy:</strong> Your online activities are never monitored or recorded.</li>
    <li><strong>Multiple Device Support:</strong> Secure all your devices simultaneously.</li>
    <li><strong>Bypass Geo-Restrictions:</strong> Access blocked websites and services in Bangladesh.</li>
</ul>

<h2>Why Choose Smart Digital Hub</h2>
<ul>
    <li><strong>Verified & Trusted Service:</strong> We provide genuine, authorized IPVanish subscriptions.</li>
    <li><strong>Instant Digital Delivery:</strong> Get your IPVanish account details within 2-30 minutes of purchase.</li>
    <li><strong>Competitive Pricing:</strong> Affordable access to premium VPN services in BD.</li>
    <li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you every step of the way.</li>
    <li><strong>Secure Transactions:</strong> Your purchase is safe and secure with Smart Digital Hub.</li>
</ul>

<h2>Important Instructions</h2>
<p>After your purchase, please check your email for the IPVanish account details. Follow the provided instructions to log in and start using your VPN service immediately. If you encounter any issues, please refer to our customer support options.</p>

<h2>Customer Support</h2>
<p>For any queries or assistance, feel free to reach out to us:</p>
<ul>
    <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
    <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857">https://wa.me/+8801322230857</a></li>
</ul>

<h2>Call To Action</h2>
<p><strong>Don''t compromise on your online privacy. Buy your IPVanish VPN subscription from Smart Digital Hub today and experience true internet freedom!</strong></p>',
  150,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501182056.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'out_of_stock',
  '[{"name":"1 Month","price":150,"warranty":"hide"}]'::jsonb,
  'Buy IPVanish VPN – Secure & Fast Browsing in BD',
  'Get IPVanish VPN from Smart Digital Hub for secure, private, and fast internet access in Bangladesh. Instant delivery & 24/7 support. Protect your online freedom!',
  'IPVanish VPN, buy VPN Bangladesh, secure internet BD, fast VPN, online privacy, Smart Digital Hub IPVanish, VPN subscription BD, best VPN service',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '667a4a21-39e4-4d29-b54e-af370bf12f5f',
  'QuillBot',
  'quillbot',
  'Quillbot Premium - 100% Authentic and Genuine Subscription.',
  'Unlock advanced writing with QuillBot Premium 1-month shared account from Smart Digital Hub. Instant delivery & verified access for BD users.',
  '<h2>Introduction</h2><p>Unlock your writing potential with QuillBot Premium, your ultimate writing companion. Whether you''re a student crafting essays, a freelancer refining content, a developer documenting code, or a professional preparing reports, QuillBot offers cutting-edge AI to enhance your work. With a 1-month shared account from Smart Digital Hub, you can achieve clarity, conciseness, and confidence in all your writing endeavors.</p><h2>What You Will Receive</h2><ul><li><strong>QuillBot Premium Shared Account:</strong> Access all premium features for one month.</li><li><strong>Instant Digital Delivery:</strong> Your account details will be delivered digitally within 2-30 minutes after purchase.</li><li><strong>Verified Service:</strong> A secure and reliable account from Smart Digital Hub.</li><li><strong>Full Premium Features:</strong> Enjoy unlimited paraphrasing, grammatical enhancements, plagiarism checker, and more.</li></ul><h2>Key Features</h2><ul><li><strong>Advanced Paraphrasing Modes:</strong> Choose from various modes like Standard, Fluency, Creative, Formal, Shorten, and Expand to rephrase text effectively.</li><li><strong>Grammar Checker:</strong> Eliminate errors and refine your writing with comprehensive grammar and spelling checks.</li><li><strong>Plagiarism Checker:</strong> Ensure originality with an integrated plagiarism detection tool (limited usage applies).</li><li><strong>Co-Writer:</strong> A dedicated writing space that combines paraphrasing, grammar checking, and summarising.</li><li><strong>Summarizer:</strong> Quickly condense articles, papers, or documents into key points.</li><li><strong>Citation Generator:</strong> Easily create citations in various styles for academic and professional works.</li><li><strong>Increased Word Limit:</strong> Process more words at once compared to the free version.</li><li><strong>Priority Support:</strong> Access premium customer support for any queries.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>At Smart Digital Hub, we are committed to providing genuine digital subscriptions with unmatched service. When you choose us for your QuillBot Premium subscription, you benefit from:</p><ul><li><strong>Fast Delivery:</strong> Get your account details within minutes, not hours.</li><li><strong>Secure Access:</strong> We ensure your account access is safe and reliable.</li><li><strong>Verified Service:</strong> Trust in our established reputation for quality digital products.</li><li><strong>Excellent Customer Support:</strong> Our dedicated team is ready to assist you.</li><li><strong>Competitive Pricing:</strong> Enjoy premium features at an affordable price in Bangladesh.</li></ul><h2>Important Instructions</h2><p>Please read these instructions carefully:</p><ul><li>After purchase, you will receive your QuillBot Premium shared account details via email.</li><li>This is a shared account, meaning multiple users will access it. Please be mindful of others and do not change passwords or account information.</li><li>Access is valid for one month from the time of delivery.</li><li>Use the account responsibly and adhere to QuillBot''s terms of service.</li><li>For any issues, please contact our customer support immediately.</li></ul><h2>Customer Support</h2><p>We''re here to help! If you have any questions or encounter issues, please reach out to us:</p><ul><li><strong>Email:</strong> hello@sagor.pro.bd</li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p>Don''t let writing challenges hold you back. <strong>Get your QuillBot Premium 1-Month Shared Account today</strong> and transform your writing with Smart Digital Hub!</p>',
  450,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501490499.png',
  'bec5317f-1180-4eae-ae4b-bd4466f97f7f',
  'in_stock',
  '[{"name":"1 Month shared ","price":450,"warranty":"hide"}]'::jsonb,
  'QuillBot Premium Shared Account - 1 Month Plan BD',
  'Enhance your writing with QuillBot Premium from Smart Digital Hub. Get a 1-month shared account with instant delivery. Perfect for students, writers, and professionals in Bangladesh.',
  'QuillBot premium Bangladesh, buy QuillBot BD, QuillBot subscription, paraphrasing tool BD, writing assistant Bangladesh, Smart Digital Hub QuillBot, 1 month QuillBot plan, QuillBot discount BD',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'a6aae75a-d1a5-4505-82ff-3aa12cae7877',
  'Perplexity Ai Pro',
  'perplexity-ai',
  'Perplexity Pro -100% Authentic and Genuine Subscription.',
  'Unlock premium AI features for advanced research, writing, and coding with Perplexity AI Pro from Smart Digital Hub.',
  '<h2>Perplexity AI Pro Subscription in Bangladesh</h2><p>Experience the next level of AI-powered research and content creation with Perplexity AI Pro, brought to you by Smart Digital Hub. Whether you''re a student, professional, developer, or content creator, Perplexity AI Pro offers unparalleled insights and real-time information to supercharge your productivity.</p><h3>What You Will Receive</h3><ul><li>Your chosen Perplexity AI Pro subscription plan (1 Month or 1 Year).</li><li>Instant digital delivery of account access or activation instructions via email.</li><li>Secure and verified access to all premium Perplexity AI Pro features.</li></ul><h3>Key Features of Perplexity AI Pro</h3><ul><li><strong>Advanced Search & Research:</strong> Get in-depth, cited answers to complex questions, drawing from millions of sources.</li><li><strong>Real-time Information:</strong> Access the most up-to-date information, not limited by outdated datasets.</li><li><strong>Content Generation:</strong> Generate high-quality text, summaries, and creative content with ease.</li><li><strong>Coding Assistance:</strong> Get help with programming tasks, debugging, and code generation.</li><li><strong>Academic & Professional Support:</strong> Ideal for students, researchers, and professionals needing reliable data.</li><li><strong>User-Friendly Interface:</strong> Navigate and utilize powerful AI features effortlessly.</li></ul><h3>Why Choose Smart Digital Hub for Perplexity AI Pro?</h3><ul><li><strong>Trusted Service:</strong> Smart Digital Hub is a reliable provider of digital subscriptions in Bangladesh.</li><li><strong>Instant Delivery:</strong> Get your Perplexity AI Pro access within 2-30 minutes after purchase.</li><li><strong>Secure Transactions:</strong> Shop with confidence knowing your data is protected.</li><li><strong>Competitive Pricing:</strong> Enjoy premium AI at affordable rates tailored for the Bangladeshi market.</li><li><strong>Dedicated Customer Support:</strong> We are here to assist you every step of the way.</li></ul><h3>Important Instructions</h3><p>After your purchase, please check your email (including spam/junk folders) for delivery details. You will receive instructions on how to access or activate your Perplexity AI Pro subscription. If you have any issues, please contact our support team immediately.</p><h3>Customer Support</h3><p>Have questions or need assistance? Reach out to us:</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h3>Get Perplexity AI Pro Today!</h3><p>Don''t miss out on the power of advanced AI. Elevate your work, studies, and creativity. Purchase your Perplexity AI Pro subscription from Smart Digital Hub now and transform the way you interact with information!</p>',
  999,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771496473584.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'out_of_stock',
  '[{"name":"1 Month","price":199,"warranty":"hide"},{"name":"1 Year","price":999,"warranty":"hide"}]'::jsonb,
  'Perplexity AI Pro Subscription BD - 1 Month & 1 Year',
  'Unlock advanced AI with Perplexity AI Pro from Smart Digital Hub. Get instant access, secure service, and boost your research, writing, and coding with powerful features.',
  'Perplexity AI Pro, AI subscription Bangladesh, Perplexity AI BD, AI tools Bangladesh, premium AI access',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'a23a225c-4bf7-4461-9385-7960ddf3590b',
  'Nord VPN',
  'nordvpn',
  'Nordvpn - 100% Authentic and Genuine Subscription.

Shared Account (1Device Only).
Personal Account (10 Device)',
  'Get NordVPN 1 Month Shared account from Smart Digital Hub for secure, private, and unrestricted internet access in Bangladesh.',
  '<h2>NordVPN 1 Month Shared Account – Secure Your Digital Life</h2><p>In today''s digital world, online privacy and security are paramount. With increasing threats and geo-restrictions, a Virtual Private Network (VPN) is no longer a luxury but a necessity. Smart Digital Hub brings you the NordVPN 1 Month Shared Account, offering you a robust solution to protect your online activities and access global content right from Bangladesh.</p><h3>What You Will Receive</h3><ul><li><strong>1 Month NordVPN Shared Account:</strong> Your personal access to a premium NordVPN account.</li><li><strong>Valid for 30 Days:</strong> Enjoy uninterrupted service for a full month.</li><li><strong>Instant Digital Delivery:</strong> Receive your account details within 2-30 minutes of purchase.</li><li><strong>Access to Premium Features:</strong> Enjoy all the benefits of NordVPN.</li></ul><h3>Key Features</h3><ul><li><strong>Strong Encryption:</strong> Protect your data with military-grade encryption standards.</li><li><strong>Bypass Geo-Restrictions:</strong> Access your favorite streaming services and websites from anywhere in the world.</li><li><strong>High-Speed Connections:</strong> Experience fast and stable connections for browsing, streaming, and gaming.</li><li><strong>No-Log Policy:</strong> Your online activities remain private with NordVPN''s strict no-log policy.</li><li><strong>Multiple Devices Support:</strong> Use NordVPN on various devices.</li><li><strong>Threat Protection:</strong> Block malicious websites and ads.</li></ul><h3>Why Choose Smart Digital Hub for NordVPN?</h3><ul><li><strong>Trusted Provider in Bangladesh:</strong> Smart Digital Hub is a reputable name for digital subscriptions in BD.</li><li><strong>Verified Accounts:</strong> We ensure all accounts are genuine and fully functional.</li><li><strong>Fast & Reliable Delivery:</strong> Get your NordVPN details quickly, often within minutes.</li><li><strong>Competitive Pricing:</strong> Enjoy premium VPN service at an affordable price of ৳99.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or issues.</li><li><strong>Secure Transactions:</strong> Your payment information is always safe with us.</li></ul><h3>Important Instructions</h3><ul><li>This is a shared account. Please do not change the account password or any other account settings.</li><li>Changing account details may lead to account termination without a refund.</li><li>For any issues or support, please contact our customer service immediately.</li></ul><h3>Customer Support</h3><p>For any assistance, feel free to reach out to us:</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h3>Secure Your Online World Today!</h3><p>Don''t compromise on your online security and freedom. Get your NordVPN 1 Month Shared Account from Smart Digital Hub today and experience a truly private and unrestricted internet. Click "Add to Cart" now!</p>',
  250,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500923775.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'in_stock',
  '[{"name":"1 Month Shared ","price":250,"warranty":"hide"}]'::jsonb,
  'NordVPN 1 Month Shared Account – Smart Digital Hub',
  'Get secure, private internet access with NordVPN 1 Month Shared account from Smart Digital Hub. Fast delivery, verified service, and dedicated support for Bangladesh users.',
  'NordVPN Bangladesh, NordVPN BD, buy NordVPN, VPN subscription BD, secure VPN, online privacy Bangladesh, internet security BD, cheapest NordVPN, Smart Digital Hub NordVPN',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'f80bfa29-b496-4f01-9bb9-531c144ed29c',
  'Netflix',
  'netflix',
  'Netflix 4K Ultra HD - 100% Authentic and Genuine Subscription.',
  'Get your Netflix 1 Month Personal Profile from Smart Digital Hub for unlimited streaming in Bangladesh.',
  '<h2>Introduction</h2><p>Immerse yourself in a world of endless entertainment with a Netflix 1 Month Personal Profile from Smart Digital Hub. Perfect for students, freelancers, developers, content creators, and professionals in Bangladesh, this subscription offers unparalleled access to a vast library of movies, TV shows, documentaries, and more, all without interruptions. Enjoy your favorite content anytime, anywhere, on any device.</p><h2>What You Will Receive</h2><ul><li><strong>Netflix 1 Month Personal Profile:</strong> Your own dedicated profile within a premium Netflix account, ensuring a personalized and private viewing experience.</li><li><strong>Instant Digital Delivery:</strong> Access details delivered directly to your email within 2-30 minutes of purchase.</li><li><strong>Premium Features:</strong> Enjoy HD/UHD streaming (where available), multiple profiles (within your personal profile), and offline downloads.</li></ul><h2>Key Features</h2><ul><li><strong>Personalized Experience:</strong> Your own profile means tailored recommendations, watch history, and playlists.</li><li><strong>Vast Content Library:</strong> Explore thousands of titles, including Netflix Originals, blockbuster movies, and trending series.</li><li><strong>Ad-Free Streaming:</strong> Enjoy uninterrupted viewing without commercials.</li><li><strong>Multi-Device Access:</strong> Watch on your smartphone, tablet, laptop, smart TV, or gaming console.</li><li><strong>High-Quality Streaming:</strong> Experience content in stunning HD and even Ultra HD (4K) resolution, depending on content availability and your internet speed.</li></ul><h2>Why Choose Smart Digital Hub</h2><ul><li><strong>Verified Service:</strong> Smart Digital Hub is a trusted provider of digital subscriptions in Bangladesh.</li><li><strong>Fast & Secure Access:</strong> We ensure quick delivery and secure access to your Netflix profile.</li><li><strong>Competitive Pricing:</strong> Get the best value for your Netflix subscription at only ৳350.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or issues.</li><li><strong>Customer Satisfaction:</strong> We prioritize your satisfaction with reliable service and support.</li></ul><h2>Important Instructions</h2><p>After your purchase, you will receive an email with your Netflix personal profile details and clear instructions on how to access it. Please do not change the profile name or password of the main account. Only use your designated personal profile.</p><h2>Customer Support</h2><p>Should you have any questions or require assistance, please don''t hesitate to reach out:</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p>Ready for endless entertainment? Get your Netflix 1 Month Personal Profile today from Smart Digital Hub and start streaming!</p>',
  450,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502010503.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'in_stock',
  '[{"name":"1 Month Personal Profile ","price":450,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Netflix 1 Month Personal Profile - Smart Digital Hub',
  'Get your Netflix 1 Month Personal Profile instantly from Smart Digital Hub. Enjoy unlimited movies & TV shows in Bangladesh. Secure & fast delivery!',
  'Netflix subscription BD, Netflix personal profile, buy Netflix Bangladesh, Netflix 1 month, Smart Digital Hub Netflix',
  NULL,
  'Smart Digital Hub',
  'NET20',
  200,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '11381011-b2b3-42c1-901b-156f56fd0b18',
  'Adobe Creative Pro',
  'adobe-creative-cloud',
  'Adobe Creative Pro - 100% Authentic and Genuine Subscription. Personal Mail Subscription ✨',
  'Get instant access to Adobe Creative Cloud Pro in Bangladesh for 1 or 3 months, only at Smart Digital Hub.',
  '<h2>Unleash Your Creativity with Adobe Creative Cloud Pro</h2>
<p><strong>Adobe Creative Cloud Pro</strong> is the ultimate suite of creative applications, perfect for designers, developers, videographers, photographers, and marketers. Whether you''re a student, freelancer, or a seasoned professional in Bangladesh, Smart Digital Hub offers you a reliable and affordable way to get your hands on the world''s leading creative tools.</p>

<h3>What You Will Receive</h3>
<ul>
    <li>Instant digital delivery of your Adobe Creative Cloud Pro subscription.</li>
    <li>Access to all Adobe applications, including Photoshop, Illustrator, Premiere Pro, After Effects, and more.</li>
    <li>Your chosen plan duration: 1 Month or 3 Month.</li>
    <li>Detailed instructions for activation and use.</li>
</ul>

<h3>Key Features</h3>
<ul>
    <li><strong>Full Suite Access:</strong> Get all 20+ creative desktop and mobile apps, including classics like Photoshop, Illustrator, and InDesign, plus new tools like Adobe XD and Spark.</li>
    <li><strong>Cloud Storage:</strong> Benefit from cloud storage to seamlessly sync your projects across devices and collaborate with others.</li>
    <li><strong>Always Latest Versions:</strong> Enjoy automatic updates to the latest versions of all Adobe applications, ensuring you always have cutting-edge features.</li>
    <li><strong>Extensive Libraries:</strong> Access Adobe Fonts, Stock assets, and Portfolio for professional-grade resources.</li>
    <li><strong>Cross-Device Compatibility:</strong> Work on your projects from anywhere, on any device.</li>
</ul>

<h3>Why Choose Smart Digital Hub for Adobe Creative Cloud Pro?</h3>
<ul>
    <li><strong>Verified Service:</strong> We provide genuine Adobe Creative Cloud Pro subscriptions, ensuring you get legitimate access.</li>
    <li><strong>Fast Delivery:</strong> Get your subscription delivered digitally within 2-30 minutes, so you can start creating without delay.</li>
    <li><strong>Competitive Price:</strong> Enjoy affordable pricing tailored for the Bangladesh market.</li>
    <li><strong>Secure Access:</strong> Your account details and privacy are our top priority.</li>
    <li><strong>Dedicated Customer Support:</strong> Our team is here to assist you every step of the way.</li>
</ul>

<h3>Important Instructions</h3>
<p>After your purchase, please check your email for activation details. Follow the instructions carefully to activate your Adobe Creative Cloud Pro subscription. Ensure you have a stable internet connection for the activation process.</p>

<h3>Customer Support</h3>
<p>Have questions or need assistance? Our friendly support team is ready to help!</p>
<ul>
    <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
    <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h3>Unleash Your Potential Today!</h3>
<p>Don''t let anything hold back your creativity. Purchase your Adobe Creative Cloud Pro subscription from Smart Digital Hub today and transform your ideas into reality!</p>',
  200,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771499926266.jpg',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'in_stock',
  '[{"name":"1 Month ","price":200,"in_stock":false,"warranty":"hide"},{"name":"3 Month","price":499,"in_stock":false,"warranty":"hide"},{"name":"12 Month","price":13000,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Adobe Creative Cloud Pro – Smart Digital Hub Official',
  'Unlock your creative potential with Adobe Creative Cloud Pro from Smart Digital Hub. Get instant access to all Adobe apps for students, freelancers, and professionals in Bangladesh.',
  'Adobe Creative Cloud Pro, Adobe subscription BD, buy Adobe Bangladesh, Creative Cloud monthly, Smart Digital Hub Adobe',
  NULL,
  'Smart Digital Hub',
  'FARDINSRABONY',
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'b36354f0-7d35-4fa7-9c58-70b1fe391e6f',
  'iLovePDF',
  'ilovepdf',
  'iLovePdf premium - 100% Authentic and Genuine Subscription.',
  NULL,
  NULL,
  250,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500649890.png',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'in_stock',
  '[{"name":"1 Month","price":250,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  'iLovePDF',
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '0d34d2d1-ae2e-4cb2-bcb8-5194f1080496',
  'Express VPN',
  'express-vpn',
  'ExpressVpn - 100% Authentic and Genuine Subscription.',
  NULL,
  NULL,
  300,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501127433.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'out_of_stock',
  '[{"name":"1 Month Shared","price":99,"warranty":"hide"},{"name":"1 Month Personal ","price":300,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '974bbf25-e006-43a7-87bd-4eb8d28001ac',
  'HMA VPN',
  'hma-vpn',
  'HmaVpn - 100% Authentic and Genuine Subscription.',
  NULL,
  NULL,
  150,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501241241.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'out_of_stock',
  '[{"name":"1 Month","price":150,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '7b1fa2fc-4145-4d62-828e-e635f2f0a462',
  'Midjourney',
  'midjourney',
  'Midjourney V7 Unlimited Plan -100% Authentic and Genuine Subscription.',
  NULL,
  NULL,
  300,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771499618384.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'out_of_stock',
  '[{"name":"1 Month Shared","price":300,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '133b19c1-8c2d-4da5-8bca-0877a533e404',
  'Nitro',
  'nitro',
  'Nitro PDF Pro – Lifetime License | Windows - 100% Authentic and Genuine Subscription.',
  NULL,
  NULL,
  799,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500312259.png',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'out_of_stock',
  '[{"name":"Lifetime Key","price":799,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '8b261a6b-db01-432e-889d-dd0195cb024f',
  'SonyLiv',
  'sonyliv',
  'SonyLiv - 100% Authentic and Genuine Subscription',
  NULL,
  NULL,
  150,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502279049.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'out_of_stock',
  '[{"name":"1 Month Shared","price":150,"warranty":"hide"}]'::jsonb,
  NULL,
  NULL,
  NULL,
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '7ac4f0ba-bd9b-49c8-a6dd-43fd816d911c',
  'Norton VPN',
  'norton-vpn-bangladesh-1-month',
  'NortonVpn - 100% Authentic and Genuine Subscription.',
  'Secure your online privacy and data with Norton VPN from Smart Digital Hub for 1 month.',
  '<h2>Introduction</h2><p>In an increasingly connected world, protecting your online privacy and security is paramount. Norton VPN offers a robust solution to safeguard your digital life, ensuring your internet activities remain private and secure. Whether you''re a student, freelancer, developer, content creator, or a professional in Bangladesh, Norton VPN provides the peace of mind you need to navigate the internet freely and safely.</p><h2>What You Will Receive</h2><p>Upon purchase, you will receive:</p><ul><li>Access to a premium Norton VPN account for 1 month.</li><li>Instant digital delivery to your email within 2-30 minutes.</li><li>Full instructions on how to set up and use your Norton VPN.</li></ul><h2>Key Features</h2><ul><li><strong>Advanced Encryption:</strong> Protect your data with military-grade encryption, keeping your online activities hidden from snoopers and cyber threats.</li><li><strong>No-Log Policy:</strong> Norton VPN adheres to a strict no-log policy, meaning your online activities are never tracked or stored.</li><li><strong>Global Server Network:</strong> Access a wide range of servers worldwide, allowing you to bypass geo-restrictions and enjoy content from anywhere.</li><li><strong>Secure Wi-Fi:</strong> Automatically secure your connection on public Wi-Fi hotspots, protecting your personal information from potential threats.</li><li><strong>Unlimited Bandwidth:</strong> Enjoy fast and uninterrupted browsing, streaming, and downloading without any data limitations.</li><li><strong>Cross-Device Compatibility:</strong> Use Norton VPN on multiple devices, including your PC, Mac, smartphone, and tablet.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>At Smart Digital Hub, we are committed to providing reliable and affordable digital solutions. When you choose us for your Norton VPN subscription, you benefit from:</p><ul><li><strong>Verified Service:</strong> We provide genuine, legitimate digital products.</li><li><strong>Fast Delivery:</strong> Get your Norton VPN access almost instantly, usually within 2-30 minutes of purchase.</li><li><strong>Secure Access:</strong> We ensure a smooth and secure activation process.</li><li><strong>Competitive Pricing:</strong> Enjoy premium services at the best prices in Bangladesh.</li><li><strong>Dedicated Customer Support:</strong> Our team is here to assist you every step of the way.</li></ul><h2>Important Instructions</h2><ul><li>After purchase, check your email (including spam/junk folders) for delivery details.</li><li>Follow the provided instructions carefully to activate your Norton VPN.</li><li>If you encounter any issues, please contact our support team immediately.</li></ul><h2>Customer Support</h2><p>For any questions or assistance, feel free to reach out to us:</p><ul><li>Email: hello@sagor.pro.bd</li><li>WhatsApp: <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Don''t compromise on your online security! Buy Norton VPN today from Smart Digital Hub and experience a truly private and secure internet.</strong></p>',
  150,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501392878.png',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'out_of_stock',
  '[{"name":"1 Month","price":150,"warranty":"hide"}]'::jsonb,
  'Buy Norton VPN - Secure Your Online Privacy in BD',
  'Get Norton VPN from Smart Digital Hub for just ৳150! Enjoy secure, private internet access with instant delivery. Protect your data and browse freely in Bangladesh.',
  'Norton VPN Bangladesh, buy Norton VPN BD, secure VPN, online privacy BD, Smart Digital Hub Norton VPN',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'f489aea1-2661-4a1d-875b-c6f7bc44ab9a',
  'CamSceaner',
  'camscanner-premium-subscription-bd',
  'CamSceaner Pro -  - 100% Authentic and Genuine Subscription.',
  'Get CamScanner Premium for effortless document scanning, editing, and sharing in Bangladesh.',
  '<h2>Introduction</h2>
<p>Transform your smartphone into a powerful, portable scanner with <strong>CamScanner Premium</strong>! Say goodbye to bulky scanners and hello to crystal-clear digital documents, anytime, anywhere. Smart Digital Hub brings you affordable and authentic CamScanner Premium subscriptions in Bangladesh, designed to boost your productivity.</p>

<h2>What You Will Receive</h2>
<p>Upon purchase, you will receive:</p>
<ul>
  <li><strong>Instant Digital Delivery:</strong> Your CamScanner Premium account details (login credentials) will be delivered to your email within 2-30 minutes of purchase.</li>
  <li><strong>Full Premium Features:</strong> Enjoy all the advanced functionalities of CamScanner Premium.</li>
  <li><strong>Verified & Secure Access:</strong> We ensure a safe and legitimate subscription experience.</li>
</ul>

<h2>Key Features of CamScanner Premium</h2>
<ul>
  <li><strong>Smart Scanning:</strong> Automatically crops, enhances, and sharpens document images.</li>
  <li><strong>OCR (Optical Character Recognition):</strong> Extract text from images for editing and searching.</li>
  <li><strong>Ad-Free Experience:</strong> Enjoy uninterrupted scanning and managing your documents.</li>
  <li><strong>High-Quality PDF & JPEG:</strong> Generate professional-looking documents.</li>
  <li><strong>Cloud Storage:</strong> Sync and access your documents across all devices.</li>
  <li><strong>E-signature:</strong> Sign documents digitally with ease.</li>
  <li><strong>Batch Processing:</strong> Scan multiple documents quickly.</li>
  <li><strong>Document Protection:</strong> Add watermarks or password protect your important files.</li>
</ul>

<h2>Why Choose Smart Digital Hub for CamScanner Premium?</h2>
<p>At Smart Digital Hub, we prioritize your digital experience. Here''s why we are your best choice:</p>
<ul>
  <li><strong>Trusted Provider:</strong> We are a recognized and reliable source for digital subscriptions in Bangladesh.</li>
  <li><strong>Fast Delivery:</strong> Get your premium access quickly, often within minutes.</li>
  <li><strong>Affordable Pricing:</strong> Competitive prices for genuine CamScanner Premium subscriptions.</li>
  <li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or issues.</li>
  <li><strong>Secure Transactions:</strong> Your purchase is safe and secure with us.</li>
</ul>

<h2>Important Instructions</h2>
<ul>
  <li>After purchasing, check your email for the CamScanner Premium login details.</li>
  <li>Follow the instructions provided in the email to activate your premium access.</li>
  <li>Ensure your device meets the minimum requirements for the CamScanner app.</li>
  <li>For any issues or delays, please contact our customer support immediately.</li>
</ul>

<h2>Customer Support</h2>
<p>Have questions or need assistance? Reach out to us:</p>
<ul>
  <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
  <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h2>Ready to Boost Your Productivity?</h2>
<p>Don''t miss out on the incredible features of CamScanner Premium. <strong>Get your subscription from Smart Digital Hub today</strong> and streamline your document management!</p>',
  99,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500497918.png',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'in_stock',
  '[{"name":"1 Month","price":99,"warranty":"hide"},{"name":"12 Month","price":990,"warranty":"hide"}]'::jsonb,
  'CamScanner Premium Subscription BD - Smart Digital Hub',
  'Get CamScanner Premium in Bangladesh for effortless document scanning, editing & sharing. Instant delivery, secure access & top-notch support from Smart Digital Hub.',
  'CamScanner premium, CamScanner Bangladesh, buy CamScanner BD, document scanner app, PDF scanner app, Smart Digital Hub, CamScanner subscription, digital scanner, student tools, freelancer tools',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '924ad7f0-f8d6-470b-a65e-3141ab9be970',
  'Gemini Ai',
  'gemini-ai',
  'Gemini Ai Pro -100% Authentic and Genuine Subscription. Personal Email Subscription✨',
  'Unlock Google Gemini AI power instantly in Bangladesh for enhanced productivity and creativity.',
  '<h2>Introduction</h2><p>Experience the cutting-edge power of Google Gemini AI in Bangladesh! Smart Digital Hub brings you instant access to this revolutionary AI tool, designed to elevate your productivity and creativity. Whether you''re a student, freelancer, developer, content creator, or a professional, Gemini AI offers unparalleled capabilities to assist you in various tasks.</p><h2>What You Will Receive</h2><ul><li>Instant access to a genuine Gemini AI account.</li><li>Your chosen subscription plan (1 Month or 1 Year).</li><li>Comprehensive guidance for activation and usage.</li><li>Dedicated customer support for any queries.</li></ul><h2>Key Features</h2><ul><li><strong>Advanced AI Capabilities:</strong> Leverage state-of-the-art AI for writing, coding, brainstorming, and more.</li><li><strong>Multimodal Reasoning:</strong> Understands and operates across text, images, audio, and video.</li><li><strong>Enhanced Productivity:</strong> Automate tasks, generate ideas, and streamline your workflow.</li><li><strong>Personalized Assistance:</strong> Tailor AI interactions to your specific needs and preferences.</li><li><strong>Secure Access:</strong> Enjoy peace of mind with verified and secure account access.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>At Smart Digital Hub, we are committed to providing reliable and affordable digital solutions. When you choose us for your Gemini AI subscription, you benefit from:</p><ul><li><strong>Instant Delivery:</strong> Get access to your Gemini AI account within 2-30 minutes of purchase.</li><li><strong>Verified Service:</strong> We provide legitimate subscriptions ensuring a seamless experience.</li><li><strong>Competitive Pricing:</strong> Enjoy the best prices for Gemini AI in Bangladesh.</li><li><strong>Excellent Customer Support:</strong> Our team is ready to assist you every step of the way.</li><li><strong>Secure Transactions:</strong> Your purchase is safe and secure with our trusted platform.</li></ul><h2>Important Instructions</h2><p>After your purchase, please check your email for activation details. You will receive clear, easy-to-follow instructions to get started with your Gemini AI account immediately. Ensure you follow all steps to enjoy uninterrupted service.</p><h2>Customer Support</h2><p>For any questions or assistance, please reach out to us:</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Don''t miss out! Get your Gemini AI subscription today and transform the way you work and create!</strong></p>',
  2000,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771497594128.png',
  '361e49ce-0c40-4dc1-bb62-557fde153e01',
  'in_stock',
  '[{"name":"18 Month admin account","price":2000,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Gemini AI Subscription BD - Instant Access',
  'Unlock the power of Google Gemini AI in Bangladesh. Get instant access for students, freelancers & professionals. Affordable plans, secure access, 24/7 support.',
  'Gemini AI Bangladesh, Gemini AI BD, buy Gemini AI, Gemini subscription, AI tools Bangladesh, Google Gemini, Gemini AI for students, Gemini AI for professionals, instant Gemini access, Smart Digital Hub Gemini',
  NULL,
  'Smart Digital Hub',
  'TECH80',
  1750,
  '18 Month admin account',
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'd27503ec-ddb7-428e-b02e-ea382ce8b46f',
  'Cruchyroll',
  'crunchyroll-premium-profile-1-month-bd',
  'Crunchyroll - 100% Authentic and Genuine Subscription',
  'Get 1-month Crunchyroll Premium profile for ad-free anime, simulcasts, and offline viewing in Bangladesh.',
  '<h2>Crunchyroll Premium 1-Month Profile by Smart Digital Hub</h2><p>Dive into the world of anime with a Crunchyroll Premium 1-month profile from Smart Digital Hub! Enjoy unlimited access to thousands of anime titles, simulcasts directly from Japan, and an immersive, ad-free viewing experience. Whether you''re a casual viewer or a hardcore otaku, Crunchyroll Premium is your gateway to the best in anime entertainment.</p><h3>What You Will Receive</h3><ul><li><strong>1-Month Crunchyroll Premium Profile:</strong> A dedicated profile on a Crunchyroll Premium account, valid for 30 days.</li><li><strong>Instant Digital Delivery:</strong> Your profile details will be sent to your email within 2-30 minutes after purchase.</li><li><strong>Uninterrupted Anime Access:</strong> Enjoy seamless streaming without any advertisements.</li></ul><h3>Key Features</h3><ul><li><strong>Ad-Free Streaming:</strong> Watch your favorite anime without interruptions.</li><li><strong>New Episodes One Hour After Japan:</strong> Stay up-to-date with the latest series as they air.</li><li><strong>Full Access to Crunchyroll Library:</strong> Explore a vast collection of anime, manga, and dramas.</li><li><strong>Offline Viewing:</strong> Download episodes on your mobile device to watch anytime, anywhere (Crunchyroll mobile app required).</li><li><strong>Multiple Devices:</strong> Stream on your smartphone, tablet, computer, smart TV, and gaming consoles.</li></ul><h3>Why Choose Smart Digital Hub</h3><p>At Smart Digital Hub, we are committed to providing a reliable and secure digital subscription experience in Bangladesh.</p><ul><li><strong>Verified Service:</strong> We ensure genuine and active subscriptions.</li><li><strong>Fast & Secure Access:</strong> Get instant delivery and secure access to your profile.</li><li><strong>Customer Satisfaction:</strong> Our dedicated support team is here to assist you.</li><li><strong>Best Price:</strong> Enjoy competitive pricing for your favorite digital products.</li></ul><h3>Important Instructions</h3><p>After your purchase, you will receive an email with your Crunchyroll Premium profile details. Please do not change the email or password of the shared account. Misuse of the account or attempting to change credentials may result in service termination without a refund.</p><h3>Customer Support</h3><p>Having trouble or need assistance? Our support team is ready to help!</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h3>Ready to Binge?</h3><p>Don''t miss out on your favorite anime! Purchase your Crunchyroll Premium 1-month profile today and start streaming instantly with Smart Digital Hub.</p><strong>Get your Crunchyroll Premium profile now!</strong>',
  200,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502330921.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'in_stock',
  '[{"name":"1 Month Profile","price":200,"warranty":"hide"}]'::jsonb,
  'Crunchyroll Premium Profile – Watch Anime Online BD',
  'Get your Crunchyroll Premium 1-month profile from Smart Digital Hub. Enjoy ad-free anime, new episodes ASAP, and offline viewing in Bangladesh. Instant delivery!',
  'Crunchyroll Bangladesh, Crunchyroll premium BD, anime subscription BD, watch anime online Bangladesh, Smart Digital Hub anime',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '05a036f0-263f-498e-a46c-b17af117f12d',
  'Canva X Gemini Pro 18 Month',
  'canva-pro-subscription-bangladesh',
  'Canva Pro Edu - 100% Authentic and Genuine Subscription.✨',
  'Unlock Canva Pro in Bangladesh for limitless design possibilities with instant digital delivery from Smart Digital Hub.',
  '<h2>Canva Pro Subscription Bangladesh - Instant Access</h2><p>Unleash your creativity with a Canva Pro subscription from Smart Digital Hub, starting at just ৳50! Whether you''re a student, freelancer, content creator, or a professional in Bangladesh, Canva Pro offers an extensive suite of tools to bring your design ideas to life. Enjoy premium templates, stock photos, fonts, and much more, all delivered instantly.</p><h3>What You Will Receive</h3><ul><li><strong>Canva Pro Access:</strong> Full access to all premium features of Canva Pro.</li><li><strong>Your Own Account:</strong> In most cases, you''ll receive an invitation to join our Canva Pro team, maintaining your current design projects.</li><li><strong>Instant Delivery:</strong> Get your Canva Pro access within 2-30 minutes after successful payment.</li><li><strong>Verified Service:</strong> A trusted digital subscription for seamless design work.</li></ul><h3>Key Features</h3><ul><li><strong>Millions of Premium Templates:</strong> Access a vast library of professional designs for any project.</li><li><strong>Pro Content Library:</strong> Unlimited access to stock photos, videos, audio tracks, and graphic elements.</li><li><strong>Brand Kit:</strong> Easily set up your brand colors, fonts, and logos for consistent branding.</li><li><strong>Magic Resize:</strong> Instantly resize your designs for different platforms.</li><li><strong>Background Remover:</strong> Effortlessly remove backgrounds from images.</li><li><strong>Content Planner:</strong> Schedule your social media posts directly from Canva.</li><li><strong>Cloud Storage:</strong> Enjoy 100 GB of cloud storage for your projects.</li></ul><h3>Why Choose Smart Digital Hub?</h3><p>At Smart Digital Hub, we are committed to providing reliable and affordable digital subscriptions in Bangladesh. With secure payment options and a focus on customer satisfaction, you can trust us for your Canva Pro needs.</p><ul><li><strong>Fast Delivery:</strong> Get started with Canva Pro almost immediately.</li><li><strong>Secure Access:</strong> Your account security is our priority.</li><li><strong>Verified Service:</strong> A trusted source for digital products in BD.</li><li><strong>Customer Support:</strong> Dedicated support ready to assist you.</li></ul><h3>Important Instructions</h3><p>After purchasing, you will receive an invitation link to your email, allowing you to join our Canva Pro team. Please check your inbox (and spam folder) within 2-30 minutes.</p><h3>Customer Support</h3><p>Have questions or need assistance? Our support team is here to help!</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h3>Ready to Design?</h3><p>Elevate your designs with Canva Pro from Smart Digital Hub. Choose your plan today and unlock limitless creative possibilities!</p>',
  50,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500205419.png',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'in_stock',
  '[{"name":"1 Month","price":50,"warranty":"hide"},{"name":"36 Month","price":499,"warranty":"hide"}]'::jsonb,
  'Canva Pro Subscription - Smart Digital Hub',
  'Unlock Canva Pro in Bangladesh at ৳50. Get instant delivery & premium features for students, freelancers & professionals. Enhance your design game today!',
  'Canva Pro Bangladesh, Canva subscription BD, buy Canva Pro, Canva premium account, graphic design tools BD, Smart Digital Hub Canva, Canva for students, Canva for freelancers',
  NULL,
  'Smart Digital Hub',
  'CST-FREE',
  489,
  '36 Month',
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'ddf608f7-060d-4e83-9897-8bab0635347d',
  'Replit',
  'replit-core',
  'Vibe codeing master ',
  'Get a Replit 1 Month 25$ Credit subscription instantly from Smart Digital Hub for coding and collaboration.',
  '<h2>Introduction</h2>
<p>Unlock your coding potential with a <strong>Replit 1 Month 25$ Credit subscription</strong>, available now at Smart Digital Hub. Replit is a powerful online IDE that allows you to code, collaborate, and deploy projects from any device. Whether you''re a student learning to code, a freelancer building prototypes, or a professional developer, Replit provides a seamless and efficient development environment.</p>

<h2>What You Will Receive</h2>
<ul>
    <li>A brand new Replit account with <strong>1-month validity and $25 credit</strong> pre-loaded.</li>
    <li>Secure access details delivered directly to your email.</li>
    <li>Full access to Replit''s premium features for the subscription period.</li>
</ul>

<h2>Key Features</h2>
<ul>
    <li><strong>Code in Any Language:</strong> Supports over 50 programming languages.</li>
    <li><strong>Cloud-Based IDE:</strong> Access your projects from anywhere, anytime.</li>
    <li><strong>Real-time Collaboration:</strong> Work with others on projects simultaneously.</li>
    <li><strong>Hosting & Deployment:</strong> Easily host and deploy your web apps and bots.</li>
    <li><strong>Integrated AI Tools:</strong> Leverage AI for faster coding and debugging.</li>
    <li><strong>Version Control:</strong> Built-in Git integration for project management.</li>
</ul>

<h2>Why Choose Smart Digital Hub</h2>
<p>At Smart Digital Hub, we are committed to providing a reliable and trusted service for all your digital subscription needs in Bangladesh:</p>
<ul>
    <li><strong>Fast Delivery:</strong> Receive your Replit account details within 2-30 minutes.</li>
    <li><strong>Secure Access:</strong> We guarantee secure and legitimate access to your subscription.</li>
    <li><strong>Verified Service:</strong> A trusted name in digital subscriptions across Bangladesh.</li>
    <li><strong>Competitive Pricing:</strong> Get the best value for your Replit 25$ credit.</li>
    <li><strong>Dedicated Customer Support:</strong> We''re here to help you every step of the way.</li>
</ul>

<h2>Important Instructions</h2>
<ul>
    <li>After purchase, your Replit account details will be sent to your email address provided during checkout.</li>
    <li>Please check your inbox (and spam folder) within 2-30 minutes of purchase.</li>
    <li>If you face any issues, contact our customer support immediately.</li>
    <li>The $25 credit is valid for 1 month and can be used for various Replit services.</li>
</ul>

<h2>Customer Support</h2>
<p>Need assistance? Feel free to reach out to us:</p>
<ul>
    <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
    <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h2>Call To Action</h2>
<p><strong>Ready to elevate your coding experience? Purchase your Replit 1 Month 25$ Credit today from Smart Digital Hub and start creating!</strong></p>',
  350,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771607807883.jpg',
  'f605ef4f-2f0f-413c-a552-705e94d99d6a',
  'out_of_stock',
  '[{"name":"1 Month 25$ Credit","price":350,"warranty":"hide"}]'::jsonb,
  'Replit 1 Month 25$ Credit - Instant Delivery Bangladesh',
  'Get Replit 1 Month with 25$ credit instantly from Smart Digital Hub. Perfect for students, developers & creators in Bangladesh. Fast, secure & verified service!',
  'Replit subscription BD, Replit 25$ credit Bangladesh, buy Replit account BD, Replit for students Bangladesh, instant Replit delivery',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '0eff12b9-6d04-4169-ad8a-8036f574580e',
  'Capcut',
  'capcut-pro',
  'Capcut Pro - 100% Authentic and Genuine Subscription for Android, iPhone, Mac or Pc.',
  'Unlock premium CapCut Pro features for 1 month with instant digital delivery in Bangladesh from Smart Digital Hub.',
  '<h2>CapCut Pro Subscription BD - 1 Month Instant Delivery</h2>
<p>Elevate your video editing projects with a <strong>1-month CapCut Pro subscription from Smart Digital Hub</strong>. Whether you''re a content creator, student, freelancer, or professional in Bangladesh, CapCut Pro offers advanced features to bring your creative vision to life. Get instant digital delivery and unlock a world of professional editing tools.</p>

<h3>What You Will Receive</h3>
<ul>
    <li><strong>1 Month CapCut Pro Subscription:</strong> Full access to all premium features.</li>
    <li><strong>Instant Digital Delivery:</strong> Your account details will be delivered within 2-30 minutes after placing your order.</li>
    <li><strong>Secure & Verified Access:</strong> Guaranteed legitimate access to CapCut Pro.</li>
</ul>

<h3>Key Features</h3>
<ul>
    <li><strong>Advanced Editing Tools:</strong> Access exclusive filters, effects, transitions, and more.</li>
    <li><strong>No Watermarks:</strong> Export your videos without the CapCut watermark.</li>
    <li><strong>Higher Quality Exports:</strong> Save your projects in stunning high resolution.</li>
    <li><strong>Cloud Storage:</strong> Conveniently store and access your projects from anywhere.</li>
    <li><strong>AI-Powered Features:</strong> Utilize intelligent tools for a streamlined editing workflow.</li>
</ul>

<h3>Why Choose Smart Digital Hub</h3>
<p>At Smart Digital Hub, we are committed to providing reliable and high-quality digital subscription services in Bangladesh. When you choose us for your CapCut Pro subscription, you benefit from:</p>
<ul>
    <li><strong>Verified Service:</strong> We ensure genuine product keys and accounts.</li>
    <li><strong>Fast Delivery:</strong> Get started with CapCut Pro almost immediately with our quick delivery system.</li>
    <li><strong>Secure Transactions:</strong> Your purchase is safe and protected.</li>
    <li><strong>Dedicated Customer Support:</strong> Our team is here to assist you every step of the way.</li>
</ul>

<h3>Important Instructions</h3>
<p>After your purchase, you will receive an email with your CapCut Pro account details and simple instructions on how to activate your subscription. Please follow these steps carefully to ensure a smooth setup process. For any issues, refer to our customer support options.</p>

<h3>Customer Support</h3>
<p>Have questions or need assistance? Our support team is ready to help!</p>
<ul>
    <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
    <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h3>Unlock Your Creative Potential Today!</h3>
<p>Don''t let anything hold back your video editing ambitions. Get your CapCut Pro 1-month subscription from Smart Digital Hub now and transform your projects with professional-grade tools.</p>',
  350,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771500034784.webp',
  'aa60119c-36ba-4d4d-86ad-81398157b99d',
  'in_stock',
  '[{"name":"1 Month","price":350,"warranty":"hide"}]'::jsonb,
  'CapCut Pro Subscription BD - 1 Month Instant Delivery',
  'Unlock CapCut Pro features with 1-month subscription in Bangladesh. Instant delivery, secure access & reliable support from Smart Digital Hub. Enhance your video editing today!',
  'CapCut Pro BD, CapCut subscription Bangladesh, buy CapCut Pro, CapCut 1 month, video editing software BD, Smart Digital Hub CapCut, CapCut premium, editing tools Bangladesh',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '67c2d2f2-6904-4b56-b7b5-d93d1732ce31',
  'Lovable',
  'lovable-pro',
  'Lovable ai pro 105 credit Build a professional app/website easily ✨',
  'Unlock creative potential with Lovable Vibe Coding credits from Smart Digital Hub. Instant digital delivery in Bangladesh.',
  '<h2>Introduction</h2><p>Unleash your creativity and enhance your coding projects with Lovable Vibe Coding credits, exclusively from Smart Digital Hub. Whether you''re a student, freelancer, developer, or content creator, these credits provide seamless access to powerful tools and resources to bring your visions to life. We offer instant digital delivery and a secure, verified service for all our valued customers in Bangladesh.</p><h2>What You Will Receive</h2><ul><li>Instant digital delivery of your chosen Lovable Vibe Coding credits (100, 200, 300, or 500 credits).</li><li>Secure access to your Vibe Coding account.</li><li>A verified purchase from a trusted digital subscription provider in Bangladesh.</li></ul><h2>Key Features</h2><ul><li><strong>Flexible Credit Options:</strong> Choose from 100, 200, 300, or 500 credits to match your project needs.</li><li><strong>Instant Access:</strong> Get your credits delivered digitally within minutes (2-30 minutes), so you can start coding without delay.</li><li><strong>Enhanced Productivity:</strong> Utilize Vibe Coding''s platform to streamline your workflow and boost your creative output.</li><li><strong>Reliable & Secure:</strong> Enjoy a secure transaction and reliable service from Smart Digital Hub.</li><li><strong>Versatile Use:</strong> Perfect for students learning to code, freelancers managing client projects, developers building applications, and content creators exploring new digital horizons.</li></ul><h2>Why Choose Smart Digital Hub</h2><p>At Smart Digital Hub, we are committed to providing a superior digital subscription experience. Here''s why you should choose us:</p><ul><li><strong>Trusted Service:</strong> We are a verified and reliable digital subscription provider in Bangladesh.</li><li><strong>Fast Delivery:</strong> Our instant digital delivery ensures you get your credits swiftly.</li><li><strong>Secure Transactions:</strong> Your payment information and personal data are always protected.</li><li><strong>Dedicated Support:</strong> Our customer support team is ready to assist you with any queries.</li><li><strong>Competitive Pricing:</strong> Enjoy great value for your money with our affordable credit options.</li></ul><h2>Important Instructions</h2><p>After your purchase, you will receive an email with detailed instructions on how to redeem your Lovable Vibe Coding credits. Please ensure you provide a valid email address during checkout to avoid any delays. If you encounter any issues, our support team is here to help.</p><h2>Customer Support</h2><p>For any questions or assistance, please reach out to us:</p><ul><li>Email: <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li>WhatsApp: <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Ready to elevate your coding projects? Purchase your Lovable Vibe Coding credits today from Smart Digital Hub and unlock a world of possibilities!</strong></p>',
  300,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771606214292.jpeg',
  'f605ef4f-2f0f-413c-a552-705e94d99d6a',
  'out_of_stock',
  '[{"name":"100 credit ","price":300,"warranty":"hide"},{"name":"200 credit","price":480,"warranty":"hide"},{"name":"300 credit","price":600,"warranty":"hide"},{"name":"500 credit","price":800,"warranty":"hide"},{"name":"600 credit","price":900,"warranty":"hide"},{"name":"1000","price":1430,"warranty":"hide"}]'::jsonb,
  'Lovable Vibe Coding Credits - Instant Delivery Bangladesh',
  'Unlock creative potential with Lovable Vibe Coding credits from Smart Digital Hub. Instant digital delivery and secure access for students, developers, and creators in Bangladesh.',
  'Lovable Vibe Coding, Vibe Coding BD, Smart Digital Hub credits, buy Vibe Coding, programming tools Bangladesh',
  'Instant 5-10 Munite',
  'Smart Digital Hub',
  'EIDI',
  40,
  '100 credit ',
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '98ac1b83-9abf-469a-af2a-dc6465e4d1c1',
  'Youtube',
  'youtube-premium',
  'Youtube and Music - 100% Authentic and Genuine Subscription.

We give you Email+Password for Personal use.
Delivary time 1-24Hours.',
  'Enjoy ad-free YouTube, offline downloads, and background playback with a 1-month YouTube Premium account from Smart Digital Hub.',
  '<h2>Elevate Your Entertainment with YouTube Premium BD</h2><p>Unlock an uninterrupted and enhanced YouTube experience with a YouTube Premium account from Smart Digital Hub. Say goodbye to annoying ads and hello to seamless streaming, offline downloads, and background playback, all tailored for our Bangladeshi users.</p><h3>What You Will Receive</h3><ul><li><strong>1-Month YouTube Premium Access:</strong> Enjoy all the benefits of YouTube Premium for a full month.</li><li><strong>Personal Account Upgrade (Family Plan):</strong> Your existing YouTube account will be upgraded within our secure family plan, ensuring privacy and continuity.</li><li><strong>Instant Digital Delivery:</strong> Get your subscription activated within 2-30 minutes after successful payment.</li><li><strong>Dedicated Customer Support:</strong> We''re here to assist you every step of the way.</li></ul><h3>Key Features of YouTube Premium</h3><ul><li><strong>Ad-Free Viewing:</strong> Watch millions of videos without interruptions from ads.</li><li><strong>Offline Downloads:</strong> Save videos and playlists to your mobile device and watch them offline, anytime, anywhere.</li><li><strong>Background Play:</strong> Keep your videos playing when you use other apps or when your screen is off.</li><li><strong>YouTube Music Premium:</strong> Enjoy ad-free access to millions of songs, official albums, playlists, and more.</li><li><strong>YouTube Originals:</strong> Access exclusive series, movies, and events.</li></ul><h3>Why Choose Smart Digital Hub for YouTube Premium?</h3><ul><li><strong>Trusted Service:</strong> Smart Digital Hub is a verified and reliable provider of digital subscriptions in Bangladesh.</li><li><strong>Fast Delivery:</strong> We guarantee instant digital delivery within 2-30 minutes, so you can start enjoying your premium features without delay.</li><li><strong>Secure Access:</strong> Your account upgrade is handled securely and professionally.</li><li><strong>Competitive Pricing:</strong> Get the best value for your YouTube Premium subscription.</li><li><strong>Excellent Customer Support:</strong> Our team is ready to assist you pre-purchase and post-purchase via WhatsApp and email.</li></ul><h3>Important Instructions</h3><p>After your purchase, please check your email for an invitation link to join our YouTube Premium family plan. You must accept this invitation to activate your premium features. Ensure your YouTube account is associated with the email you provide during checkout.</p><h3>Customer Support</h3><p>Have questions or need assistance? Reach out to us!</p><ul><li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857">https://wa.me/+8801322230857</a></li></ul><h3>Get Your Ad-Free YouTube Experience Today!</h3><p>Don''t miss out on uninterrupted entertainment. Subscribe to YouTube Premium through Smart Digital Hub today and transform your viewing experience!</p>',
  199,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502697594.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'in_stock',
  '[{"name":"1 Month","price":199,"warranty":"hide"}]'::jsonb,
  'YouTube Premium Account BD – Ad-Free Viewing',
  'Get your YouTube Premium account from Smart Digital Hub for ad-free videos, offline downloads, and background play. Instant delivery in Bangladesh!',
  'YouTube Premium Bangladesh, YouTube subscription BD, ad-free YouTube, YouTube offline, YouTube background play, Smart Digital Hub YouTube',
  NULL,
  'Smart Digital Hub',
  'FardinSrabony',
  100,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'fb6da80f-e6ea-4a31-9f0a-5b294dd7de06',
  'Prime Video 6 Month',
  'prime-video6month',
  '6 Month Prime Video 1 Screen personal profile subscription, Pin Locked profile. Only you can access your profile',
  'Get 6 months of Prime Video subscription in Bangladesh with instant delivery from Smart Digital Hub.',
  '<h2>Introduction</h2>
<p>Unlock a world of entertainment with a <strong>6-month Prime Video subscription</strong> from Smart Digital Hub. Dive into an extensive library of movies, exclusive TV shows, and critically acclaimed Amazon Originals, all delivered directly to your inbox in Bangladesh.</p>

<h2>What You Will Receive</h2>
<ul>
    <li>A <strong>verified Prime Video account</strong> (shared) with 6 months of active subscription.</li>
    <li>Instant digital delivery details via email within 2-30 minutes of purchase.</li>
    <li>Full access to Prime Video''s streaming catalog.</li>
</ul>

<h2>Key Features</h2>
<ul>
    <li><strong>Vast Content Library:</strong> Explore thousands of movies, TV series, and documentaries.</li>
    <li><strong>Amazon Originals:</strong> Watch award-winning exclusive content not available elsewhere.</li>
    <li><strong>Multi-Device Access:</strong> Enjoy streaming on your smart TV, phone, tablet, or computer.</li>
    <li><strong>High-Quality Streaming:</strong> Experience content in HD and 4K (where available).</li>
    <li><strong>Ad-Free Experience:</strong> Enjoy uninterrupted viewing without commercials.</li>
</ul>

<h2>Why Choose Smart Digital Hub</h2>
<ul>
    <li><strong>Trusted Provider:</strong> We are a verified and reliable source for digital subscriptions in Bangladesh.</li>
    <li><strong>Instant Delivery:</strong> Get your Prime Video access within 2-30 minutes, guaranteed.</li>
    <li><strong>Secure & Private:</strong> We ensure your access is secure and your privacy protected.</li>
    <li><strong>Affordable Pricing:</strong> Enjoy competitive rates for premium entertainment.</li>
    <li><strong>Dedicated Support:</strong> Our customer service team is ready to assist you.</li>
</ul>

<h2>Important Instructions</h2>
<ul>
    <li>This is a shared Prime Video account. Please do not change the account password or any other details.</li>
    <li>Access details will be sent to your registered email address shortly after purchase.</li>
    <li>For the best experience, ensure you have a stable internet connection.</li>
</ul>

<h2>Customer Support</h2>
<p>For any queries or assistance, feel free to reach out to us:</p>
<ul>
    <li><strong>Email:</strong> hello@sagor.pro.bd</li>
    <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h2>Call To Action</h2>
<p><strong>Don''t miss out! Purchase your Prime Video 6-month subscription today and start streaming your favorite content instantly!</strong></p>',
  1100,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1786262653519.jpg',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'in_stock',
  '[{"name":"6 Month","price":1100,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Prime Video 6-Month Subscription | Smart Digital Hub',
  'Get 6 months of Prime Video in Bangladesh with instant delivery from Smart Digital Hub. Stream movies, TV shows, and originals securely and affordably.',
  'Prime Video Bangladesh, Prime Video subscription BD, 6 month Prime Video, Smart Digital Hub Prime Video, buy Prime Video BD, instant Prime Video, Amazon Prime Video Bangladesh',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '9c730de7-b4bb-4df3-a8d4-bd0bc18402fc',
  'Grammerly',
  'grammerly',
  'Grammarly Premium Business - 100% Authentic and Genuine Subscription.',
  'Get Grammarly Premium at an affordable price in Bangladesh for flawless grammar, spelling, and style.',
  '<h2>Grammarly Premium Bangladesh: Master Your Writing with Smart Digital Hub</h2><p>Unlock your full writing potential with Grammarly Premium, available at an unbeatable price in Bangladesh through Smart Digital Hub. Whether you''re a student striving for academic excellence, a freelancer crafting compelling content, a professional preparing important documents, or a developer documenting your work, Grammarly Premium is your essential writing companion. Say goodbye to embarrassing typos, awkward phrasing, and grammatical errors, and hello to clear, confident, and impactful communication.</p><h3>What You Will Receive</h3><ul><li><strong>Premium Access:</strong> Depending on your chosen plan (1 Month Shared, 6 Month Shared, or 12 Month Personal), you will receive instant access to a Grammarly Premium account.</li><li><strong>Instant Digital Delivery:</strong> Your account details will be delivered digitally within 2-30 minutes of successful payment.</li><li><strong>Seamless Integration:</strong> Use Grammarly across all your favorite platforms, including browsers, desktop apps, and mobile devices.</li></ul><h3>Key Features of Grammarly Premium</h3><ul><li><strong>Advanced Grammar & Punctuation:</strong> Catch complex grammatical errors and punctuation mistakes that free tools miss.</li><li><strong>Clarity & Conciseness:</strong> Get suggestions to rephrase sentences for better readability and impact.</li><li><strong>Vocabulary Enhancement:</strong> Discover powerful synonyms to enrich your language and avoid repetition.</li><li><strong>Plagiarism Detection:</strong> Ensure your work is original with Grammarly''s comprehensive plagiarism checker.</li><li><strong>Tone Adjustments:</strong> Fine-tune your writing to convey the right message and emotion to your audience.</li><li><strong>Fluency & Engagement:</strong> Improve sentence structure and flow for more engaging content.</li></ul><h3>Why Choose Smart Digital Hub for Grammarly Premium?</h3><p>At Smart Digital Hub, we are committed to providing premium digital subscriptions with unparalleled service in Bangladesh. Here''s why you should choose us:</p><ul><li><strong>Verified Service:</strong> We provide legitimate and verified Grammarly Premium accounts.</li><li><strong>Affordable Pricing:</strong> Get the best prices for Grammarly Premium plans in BD.</li><li><strong>Fast & Secure Access:</strong> Enjoy instant digital delivery and secure account access.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or issues.</li><li><strong>Trusted Provider:</strong> We are a trusted name in Bangladesh for digital subscription services.</li></ul><h3>Important Instructions</h3><ul><li>After purchase, please check your email for delivery of your Grammarly Premium account details.</li><li>For shared accounts, avoid making changes to the account password or profile information.</li><li>For 12 Month Personal plans, you will receive a brand new account or upgrade to your existing account.</li><li>If you face any issues, please contact our customer support immediately.</li></ul><h3>Customer Support</h3><p>Need assistance? Contact us!</p><p><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></p><p><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></p><h3>Ready to Write Your Best?</h3><p>Don''t let writing errors hold you back. Elevate your communication and achieve your goals with Grammarly Premium from Smart Digital Hub. Choose your plan today and start writing with confidence!</p>',
  300,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771501579681.png',
  'bec5317f-1180-4eae-ae4b-bd4466f97f7f',
  'in_stock',
  '[{"name":"1 Month Shared","price":300,"warranty":"hide"},{"name":"6 Month Shared","price":1500,"warranty":"hide"},{"name":"12 Month Personal","price":2500,"warranty":"hide"}]'::jsonb,
  'Grammarly Premium Bangladesh - Enhance Your Writing',
  'Get Grammarly Premium in Bangladesh at an affordable price from Smart Digital Hub. Improve grammar, spelling, and style for flawless writing. Instant delivery!',
  'Grammarly Premium, Grammarly Bangladesh, buy Grammarly BD, writing assistant, grammar checker, plagiarism checker, Smart Digital Hub, content writing tool, academic writing',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'a1718487-6300-480d-ad76-6cc1f66aadc4',
  'DisneyPlus',
  'disney-plus-subscription-bd-1-month-profile',
  'Disney Plus Premium - 100% Authentic and Genuine Subscription.',
  'Get a 1-month Disney Plus profile instantly in Bangladesh from Smart Digital Hub for unlimited entertainment.',
  '<h2>Introduction</h2>
<p>Dive into a world of endless entertainment with a <strong>Disney Plus subscription in Bangladesh</strong>! From classic animated films to blockbuster Marvel epics, Star Wars sagas, and National Geographic documentaries, Disney+ offers something for everyone. Smart Digital Hub brings you instant and secure access to your favorite content.</p>

<h2>What You Will Receive</h2>
<ul>
  <li><strong>1-Month Disney Plus Profile:</strong> Access to a premium profile within a shared Disney+ account. Enjoy personalized recommendations and watch history.</li>
  <li><strong>Instant Digital Delivery:</strong> Your Disney Plus profile details will be delivered digitally within 2-30 minutes of purchase.</li>
  <li><strong>Seamless Streaming Experience:</strong> High-quality streaming across all your compatible devices.</li>
</ul>

<h2>Key Features</h2>
<ul>
  <li><strong>Vast Content Library:</strong> Explore thousands of movies, series, and exclusive originals from Disney, Pixar, Marvel, Star Wars, National Geographic, and Star.</li>
  <li><strong>Multiple Devices:</strong> Watch on your smartphone, tablet, laptop, smart TV, and gaming consoles.</li>
  <li><strong>Ad-Free Experience:</strong> Enjoy uninterrupted viewing without commercials.</li>
  <li><strong>High-Quality Streaming:</strong> Stream in HD and 4K UHD where available.</li>
  <li><strong>Personalized Profiles:</strong> Create and manage individual profiles for a tailored viewing experience.</li>
</ul>

<h2>Why Choose Smart Digital Hub</h2>
<p>At Smart Digital Hub, we are committed to providing a reliable and trusted service for all your digital subscription needs in Bangladesh. Here''s why you should choose us:</p>
<ul>
  <li><strong>Verified Service:</strong> We ensure genuine and legitimate subscriptions.</li>
  <li><strong>Fast Delivery:</strong> Get your Disney Plus profile quickly, usually within minutes.</li>
  <li><strong>Secure Access:</strong> Your account details are handled with utmost security.</li>
  <li><strong>Competitive Pricing:</strong> Enjoy premium entertainment at an affordable price (৳350).</li>
  <li><strong>Dedicated Customer Support:</strong> We''re here to assist you every step of the way.</li>
</ul>

<h2>Important Instructions</h2>
<p>After your purchase, please check your email for the Disney Plus profile details. Do not change any account information (email, password) of the shared account. Only use the provided profile to ensure uninterrupted service.</p>

<h2>Customer Support</h2>
<p>Have questions or need assistance? Our support team is ready to help:</p>
<ul>
  <li><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></li>
  <li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li>
</ul>

<h2>Call To Action</h2>
<p>Don''t miss out on the magic! <strong>Buy your Disney Plus 1-month profile today from Smart Digital Hub</strong> and start streaming your favorite content instantly!</p>',
  350,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502158640.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'out_of_stock',
  '[{"name":"1 Month Profile","price":350,"warranty":"hide"}]'::jsonb,
  'Disney Plus Subscription BD - 1 Month Profile',
  'Enjoy unlimited movies & shows with Disney Plus in Bangladesh! Get your 1-month profile instantly from Smart Digital Hub. Secure & verified service.',
  'Disney Plus Bangladesh, Disney Plus BD, Disney+ subscription, buy Disney Plus, streaming service BD, Smart Digital Hub, Disney Plus profile',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '3af38341-d49c-47b1-9955-3eec524cdbb2',
  'Microsoft 365 & Copilot pro',
  'microsoft-365',
  'Unlock Microsoft 365 premium in Bangladesh for ৳350 with instant digital delivery from Smart Digital Hub.',
  'Unlock ultimate productivity with Microsoft 365 & Copilot Pro, featuring AI assistance, for just ৳350 from Smart Digital Hub.',
  'Microsoft 365 & Copilot Pro – Your Ultimate Productivity Hub

Boost your productivity with Microsoft 365 & Copilot Pro, brought to you by Smart Digital Hub. Whether you''re a student, freelancer, developer, content creator, or business professional, this powerful combination provides everything you need to work smarter, create faster, and achieve more.

What You''ll Receive

- 100% Genuine Microsoft 365 Account with premium Office apps.
- Microsoft Copilot Pro integrated with supported Microsoft applications.
- Instant Digital Delivery after successful purchase.
- Dedicated Customer Support to assist you whenever needed.

Key Features

- Premium Microsoft 365 Apps – Access the latest versions of Word, Excel, PowerPoint, Outlook, OneNote, and more.
- AI-Powered Copilot Pro – Generate content, analyze data, create presentations, write emails, and streamline your workflow using advanced AI.
- Multi-Device Access – Use your subscription across Windows PCs, Macs, tablets, and smartphones.
- OneDrive Cloud Storage – Securely store, sync, and share your files from anywhere.
- Advanced Security – Protect your files and personal information with Microsoft''s trusted security features.

Why Choose Smart Digital Hub?

When you buy from Smart Digital Hub, you receive:

- ✔ 100% genuine and verified digital products.
- ✔ Fast and secure digital delivery.
- ✔ Affordable pricing for customers in Bangladesh.
- ✔ Friendly and reliable customer support.
- ✔ A smooth and hassle-free activation experience.

Activation Instructions

After completing your purchase, you will receive an email containing your account details and step-by-step activation instructions. Follow the guide carefully to activate your Microsoft 365 & Copilot Pro subscription.

If you experience any issues during activation, our support team is ready to help.

Customer Support

Email: hello@sagor.pro.bd

WhatsApp: https://wa.me/8801322230857

Start Working Smarter Today

Unlock the full power of Microsoft 365 & Copilot Pro and take your productivity to the next level. Order your subscription today from Smart Digital Hub and experience the future of intelligent work.',
  350,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1783791995676.png',
  '11fd015b-cb40-4e05-b161-cdcb9a2b8b83',
  'in_stock',
  '[{"name":"1 Month","price":400,"warranty":"hide"},{"name":"3 Month","price":800,"warranty":"hide"},{"name":"6 month","price":1500,"warranty":"hide"}]'::jsonb,
  'Microsoft 365 & Copilot Pro: Boost Your Productivity in BD',
  'Unlock peak productivity with Microsoft 365 & Copilot Pro. Get instant access, secure service, and dedicated support from Smart Digital Hub in Bangladesh!',
  'Microsoft 365, Copilot Pro, productivity software, genuine Microsoft, Smart Digital Hub, digital subscription BD, office suite Bangladesh, AI assistant',
  '10',
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '6601e2d9-1874-4fd2-9911-c192217eec55',
  'Mysterium VPN',
  'mysterium-vpn',
  NULL,
  'Mysterium VPN ক্রয়ের নিয়ম device System. ',
  '<h2>Mysterium VPN: Your Gateway to Secure & Private Internet in Bangladesh</h2>
<p>In today''s digital world, online privacy and security are paramount. With <a href="https://smartdigitalhub.com/mysterium-vpn-bangladesh">Mysterium VPN</a>, you can browse, stream, and work online with complete peace of mind. Smart Digital Hub brings you this cutting-edge decentralized VPN service, ensuring your internet activities remain private and your data secure from prying eyes. Whether you''re a student, freelancer, developer, content creator, or a professional in Bangladesh, Mysterium VPN offers the robust protection you need.</p>

<h3>What You Will Receive</h3>
<ul>
<li><strong>1 Month or 2 Month Mysterium VPN Subscription:</strong> Choose the plan that best suits your needs.</li>
<li><strong>Instant Digital Delivery:</strong> Your VPN access details will be delivered digitally within 2-30 minutes of purchase.</li>
<li><strong>Secure Access:</strong> Verified and legitimate subscription directly to your email.</li>
</ul>

<h3>Key Features</h3>
<ul>
<li><strong>Decentralized Network:</strong> Powered by a global community, offering enhanced privacy and resistance to censorship.</li>
<li><strong>Robust Encryption:</strong> Protects your online data with military-grade encryption, keeping your information safe from hackers and snoopers.</li>
<li><strong>No-Log Policy:</strong> Mysterium VPN operates with a strict no-logging policy, ensuring your online activities are never recorded.</li>
<li><strong>Bypass Geo-Restrictions:</strong> Access your favorite content and services from anywhere in the world, including those restricted in Bangladesh.</li>
<li><strong>Fast & Reliable Connection:</strong> Experience smooth streaming, fast downloads, and seamless browsing without interruptions.</li>
<li><strong>Multi-Device Support:</strong> Protect all your devices – Windows, macOS, Linux, Android, iOS, and more.</li>
<li><strong>Affordable Plans:</strong> Flexible 1-month and 2-month subscription options at competitive prices.</li>
</ul>

<h3>Why Choose Smart Digital Hub for Mysterium VPN?</h3>
<ul>
<li><strong>Trusted Provider:</strong> Smart Digital Hub is a verified and reliable digital subscription service provider in Bangladesh.</li>
<li><strong>Fast Delivery:</strong> Get your Mysterium VPN subscription delivered instantly (within 2-30 minutes) after purchase.</li>
<li><strong>Secure & Verified Service:</strong> We guarantee legitimate and secure access to your VPN subscription.</li>
<li><strong>Competitive Pricing:</strong> Enjoy the best prices for Mysterium VPN in Bangladesh.</li>
<li><strong>Dedicated Customer Support:</strong> Our team is always ready to assist you with any queries or issues.</li>
</ul>

<h3>Important Instructions</h3>
<ul>
<li>After purchasing, please check your email (including spam/junk folders) for delivery.</li>
<li>Follow the instructions provided in the email to activate your Mysterium VPN subscription.</li>
<li>Ensure your device meets the minimum requirements for Mysterium VPN client installation.</li>
</ul>

<h3>Customer Support</h3>
<p>Have questions or need assistance? Our dedicated customer support team is here to help you.</p>
<p><strong>Email:</strong> <a href="mailto:hello@sagor.pro.bd">hello@sagor.pro.bd</a></p>
<p><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">Chat with us on WhatsApp</a></p>

<h3>Secure Your Digital Life Today!</h3>
<p>Don''t compromise on your online privacy and security. Get your Mysterium VPN subscription from Smart Digital Hub today and experience the internet freely and securely. Choose your plan now and protect your digital footprint!</p>',
  280,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1786554136579.jpeg',
  '30dbadb7-522a-4603-b876-ab725420529b',
  'in_stock',
  '[{"name":"1 মাস ১ ডিভাইস","price":280,"in_stock":true,"warranty":"hide"},{"name":"২ মাস ১ ডিভাইস","price":550,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Mysterium VPN | Secure & Fast VPN in Bangladesh',
  'Get Mysterium VPN in Bangladesh for ultimate online privacy and security. Fast, reliable, and instant delivery from Smart Digital Hub. Protect your data now!',
  'Mysterium VPN Bangladesh, buy Mysterium VPN BD, best VPN Bangladesh, secure VPN, fast VPN, online privacy BD, internet security Bangladesh, VPN subscription BD, Smart Digital Hub VPN',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  '88f9faa5-112a-4832-9ca9-0ae8d4178a25',
  'Amazon',
  'amazon',
  'Amazon Prime Video 4K - 100% Authentic and Genuine Subscription.',
  'Get instant Amazon Prime 1-month profile in Bangladesh from Smart Digital Hub for movies, TV shows, and more.',
  '<h2>Introduction</h2><p>Unlock a world of entertainment with an Amazon Prime 1-Month Profile from Smart Digital Hub. Perfect for students, freelancers, developers, and content creators in Bangladesh, our service provides instant, secure access to Amazon''s vast library of movies, TV shows, and exclusive content.</p><h2>What You Will Receive</h2><ul><li><strong>1-Month Amazon Prime Profile:</strong> Enjoy full access to Amazon Prime''s streaming content for 30 days.</li><li><strong>Instant Digital Delivery:</strong> Your profile details will be delivered within 2-30 minutes of purchase.</li><li><strong>Secure & Verified Service:</strong> Rest assured with our trusted and reliable service.</li></ul><h2>Key Features</h2><ul><li><strong>Extensive Content Library:</strong> Binge-watch thousands of movies, TV series, and Amazon Originals.</li><li><strong>Multi-Device Access:</strong> Watch on your smartphone, tablet, laptop, smart TV, and more.</li><li><strong>High-Quality Streaming:</strong> Enjoy content in HD and 4K where available.</li><li><strong>Ad-Free Experience:</strong> Stream your favorite shows without interruptions.</li></ul><h2>Why Choose Smart Digital Hub</h2><ul><li><strong>Fast Delivery:</strong> Get your Amazon Prime profile delivered almost instantly.</li><li><strong>Secure Access:</strong> We provide verified accounts, ensuring your privacy and access.</li><li><strong>Trusted Service:</strong> Smart Digital Hub is a reputable provider of digital subscriptions in Bangladesh.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries.</li></ul><h2>Important Instructions</h2><p>After purchase, you will receive an email with your Amazon Prime profile details. Please follow the instructions carefully to access your account. Do not change the profile password or any other account details, as this may void your subscription.</p><h2>Customer Support</h2><p>For any questions or assistance, please contact us:</p><ul><li><strong>Email:</strong> hello@sagor.pro.bd</li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Ready to explore endless entertainment? Buy your Amazon Prime 1-Month Profile from Smart Digital Hub today and start streaming instantly!</strong></p>',
  150,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1771502103941.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'in_stock',
  '[{"name":"1 Month Profile","price":150,"warranty":"hide"}]'::jsonb,
  'Buy Amazon 1-Month Profile in Bangladesh - Smart Digital Hub',
  'Get instant access to Amazon Prime 1-month profile in Bangladesh. Enjoy movies, TV shows, and more with secure, verified service from Smart Digital Hub.',
  'Amazon Prime Bangladesh, Amazon subscription BD, buy Amazon profile, Smart Digital Hub Amazon, Amazon Prime 1 month, instant Amazon access',
  NULL,
  'Smart Digital Hub',
  NULL,
  0,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';
INSERT INTO public.products (id, name, slug, description, short_description, long_description, price, image_url, category_id, stock_status, options, seo_title, meta_description, focus_keywords, delivery_time, brand, coupon_code, coupon_discount, coupon_option, is_featured, sort_order) VALUES (
  'cb96aa19-778b-41a9-b2d6-60896976a652',
  'Netflix | Prime Video Combo',
  'netflix-prime',
  'Netflix | Prime Video Combo - Ads Free
2 Device Personal Profile.',
  'Get 1 month of Netflix and Prime Video access in Bangladesh. Instant digital delivery by Smart Digital Hub.',
  '<h2>Introduction</h2><p>Unlock a world of unparalleled entertainment with the Netflix & Prime Video Combo, exclusively designed for our Bangladeshi audience. Whether you''re a student looking for a break, a freelancer unwinding after work, or a content creator seeking inspiration, this 1-month subscription offers an unbeatable dual streaming experience.</p><h2>What You Will Receive</h2><ul><li><strong>Netflix 1-Month Subscription:</strong> Access to Netflix''s vast library of award-winning movies, TV shows, documentaries, and exclusive originals.</li><li><strong>Prime Video 1-Month Subscription:</strong> Enjoy Amazon Originals, popular movies, and TV series on Prime Video.</li><li><strong>Instant Digital Delivery:</strong> Your subscription details will be delivered digitally within 2-30 minutes of purchase.</li><li><strong>Verified Account Access:</strong> Secure and reliable access to both platforms.</li></ul><h2>Key Features</h2><ul><li><strong>Unlimited Streaming:</strong> Binge-watch your favorite content without interruption.</li><li><strong>Multi-Device Compatibility:</strong> Watch on your smartphone, tablet, laptop, or smart TV.</li><li><strong>Ad-Free Experience:</strong> Enjoy uninterrupted viewing without commercials.</li><li><strong>Diverse Content Library:</strong> From Hollywood blockbusters to critically acclaimed international films and series, find something for every mood.</li><li><strong>Cost-Effective:</strong> A convenient and affordable way to enjoy two premium streaming services.</li></ul><h2>Why Choose Smart Digital Hub</h2><ul><li><strong>Trusted Service:</strong> We are a verified and reliable digital subscription provider in Bangladesh.</li><li><strong>Fast Delivery:</strong> Get your subscriptions almost instantly.</li><li><strong>Secure Access:</strong> We ensure your account access is safe and secure.</li><li><strong>Dedicated Customer Support:</strong> Our team is ready to assist you with any queries or issues.</li><li><strong>Best Value:</strong> Competitive pricing for premium digital products.</li></ul><h2>Important Instructions</h2><ul><li>After purchase, you will receive account login details via email.</li><li>Please do not change the account password or profile names to ensure uninterrupted service.</li><li>This subscription is for 1 month from the date of delivery.</li><li>For any issues, contact our support team immediately.</li></ul><h2>Customer Support</h2><p>For any assistance, please reach out to us:</p><ul><li><strong>Email:</strong> hello@sagor.pro.bd</li><li><strong>WhatsApp:</strong> <a href="https://wa.me/+8801322230857" target="_blank">https://wa.me/+8801322230857</a></li></ul><h2>Call To Action</h2><p><strong>Don''t miss out on endless entertainment! Subscribe to the Netflix & Prime Video Combo today and elevate your streaming experience with Smart Digital Hub!</strong></p>',
  400,
  'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/1785673393773.png',
  'c6ed888d-013d-477f-bbc8-1cef8c71557e',
  'in_stock',
  '[{"name":"1 Month","price":400,"in_stock":true,"warranty":"hide"}]'::jsonb,
  'Netflix & Prime Video Combo: 1 Month Subscription BD',
  'Enjoy unlimited movies, series & originals with Netflix and Prime Video 1-month combo. Instant digital delivery in Bangladesh. Get yours from Smart Digital Hub!',
  'Netflix Prime Video combo, Netflix BD, Prime Video Bangladesh, streaming subscription BD, entertainment package Bangladesh, Smart Digital Hub',
  NULL,
  'Smart Digital Hub',
  'TECH20',
  50,
  NULL,
  NULL,
  0
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  price = EXCLUDED.price, 
  image_url = EXCLUDED.image_url, 
  options = EXCLUDED.options, 
  stock_status = EXCLUDED.stock_status,
  brand = 'Smart Digital Hub';

-- 3. Banners
INSERT INTO public.banners (id, title, image_url, link, sort_order, is_active) VALUES ('573dc2d1-e16a-42e9-8c16-93770a150052', 'Capcut', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/banners/1771496147053.jpeg', NULL, 1, true) ON CONFLICT (id) DO NOTHING;

-- 4. Hot Deals
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('62d98282-2bd7-4450-a018-7c3740c138c1', '70% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771505901041.png', '667a4a21-39e4-4d29-b54e-af370bf12f5f', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('5001df5a-cdff-44b2-b976-16e9448082a5', '90% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771506011854.png', '924ad7f0-f8d6-470b-a65e-3141ab9be970', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('05869101-78b0-47e5-ac06-e3e27c2aae75', '65% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771506040997.webp', '0eff12b9-6d04-4169-ad8a-8036f574580e', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('21ce1b8f-d4c6-443c-9514-192059368d0f', '95% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771506063216.png', '05a036f0-263f-498e-a46c-b17af117f12d', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('29bb5c5b-d6a4-488e-9d8d-980868a53e28', '86% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771506085725.jpg', '11381011-b2b3-42c1-901b-156f56fd0b18', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('19ebbe7c-3c8c-4b74-a0fd-ceb457f9e56a', '55℅ OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771599696252.png', 'd27503ec-ddb7-428e-b02e-ea382ce8b46f', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('9553b400-1492-452b-998a-d6f8305e8775', '85% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771599884524.png', '2c46ff85-d929-4f0d-af75-176c64bba7ca', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.hot_deals (id, name, image_url, product_id, sort_order) VALUES ('222127a1-5f5c-4b8a-bd89-560e989ac1a8', '83% OFF', 'https://ndwjkygwqpveyeswonwa.supabase.co/storage/v1/object/public/product-images/hot-deals/1771606515399.jpeg', '67c2d2f2-6904-4b56-b7b5-d93d1732ce31', 0) ON CONFLICT (id) DO NOTHING;


INSERT INTO public.payment_methods (name, account_number, account_type, instructions, sort_order) VALUES
  ('bKash Personal', '01734698361', 'personal', 'Send Money to this personal number and enter your Transaction ID.', 1),
  ('Nagad Personal', '01734698361', 'personal', 'Send Money to this personal number and enter your Transaction ID.', 2),
  ('Rocket Personal', '01734698361', 'personal', 'Send Money to this personal number and enter your Transaction ID.', 3)
ON CONFLICT DO NOTHING;
