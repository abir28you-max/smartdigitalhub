
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
