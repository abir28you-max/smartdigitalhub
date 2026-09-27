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