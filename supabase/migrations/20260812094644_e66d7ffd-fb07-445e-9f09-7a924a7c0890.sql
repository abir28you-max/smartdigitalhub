ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_delivery_details boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_details jsonb;