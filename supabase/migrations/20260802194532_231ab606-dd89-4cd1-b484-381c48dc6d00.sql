-- 1. chat_messages: remove public read
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.chat_messages;

CREATE POLICY "Admins can read chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_chat_messages(p_session_id text)
RETURNS TABLE (id uuid, sender_type text, message text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.sender_type, m.message, m.created_at
  FROM public.chat_messages m
  WHERE m.session_id = p_session_id
    AND length(p_session_id) >= 20
  ORDER BY m.created_at ASC
$$;

REVOKE ALL ON FUNCTION public.get_chat_messages(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_messages(text) TO anon, authenticated, service_role;

-- 2. salami_submissions: remove public read
DROP POLICY IF EXISTS "Anyone can read own submission by bkash" ON public.salami_submissions;

CREATE OR REPLACE FUNCTION public.salami_number_exists(p_bkash_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salami_submissions s
    WHERE s.bkash_number = p_bkash_number
  )
$$;

REVOKE ALL ON FUNCTION public.salami_number_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salami_number_exists(text) TO anon, authenticated, service_role;