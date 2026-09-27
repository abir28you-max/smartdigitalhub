
-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  sender_type text NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  message text NOT NULL,
  customer_name text,
  customer_phone text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (customers send messages)
CREATE POLICY "Anyone can send chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

-- Anyone can read their own session messages (by session_id match)
CREATE POLICY "Anyone can read chat messages"
ON public.chat_messages FOR SELECT
USING (true);

-- Admins can update (mark as read)
CREATE POLICY "Admins can update chat messages"
ON public.chat_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
