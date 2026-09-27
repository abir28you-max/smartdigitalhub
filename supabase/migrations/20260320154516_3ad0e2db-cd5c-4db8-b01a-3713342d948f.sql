
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
