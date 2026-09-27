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