
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
