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