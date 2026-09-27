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