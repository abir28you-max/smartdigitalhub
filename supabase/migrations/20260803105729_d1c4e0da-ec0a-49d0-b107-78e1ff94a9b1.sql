DROP VIEW IF EXISTS public.payment_methods_public;

CREATE OR REPLACE FUNCTION public.get_payment_methods()
RETURNS TABLE(id uuid, name text, logo_url text, instructions text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.logo_url, p.instructions
  FROM public.payment_methods p
  WHERE p.is_active = true
  ORDER BY p.created_at
$function$;

REVOKE ALL ON FUNCTION public.get_payment_methods() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_methods() TO anon, authenticated;