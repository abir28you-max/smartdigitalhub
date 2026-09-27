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