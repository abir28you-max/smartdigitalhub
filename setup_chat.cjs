const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to Postgres...');

  // Ensure columns
  await client.query(`
    ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS logo_url text;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS customer_name text;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS customer_phone text;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
  `);

  // 1. Create get_chat_messages function
  await client.query(`
    CREATE OR REPLACE FUNCTION public.get_chat_messages(p_session_id text)
    RETURNS TABLE(id uuid, sender_type text, message text, created_at timestamp with time zone)
    LANGUAGE sql
    STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT m.id, m.sender_type, m.message, m.created_at
      FROM public.chat_messages m
      WHERE m.session_id = p_session_id
        AND p_session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ORDER BY m.created_at ASC
    $$;
  `);
  console.log('Created get_chat_messages function');

  // 2. Set permissions on function
  await client.query(`
    REVOKE ALL ON FUNCTION public.get_chat_messages(text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.get_chat_messages(text) TO anon, authenticated, service_role;
  `);

  // 3. Configure table grants & RLS policies
  await client.query(`
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

    GRANT INSERT ON TABLE public.chat_messages TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated;
    GRANT ALL ON TABLE public.chat_messages TO service_role;

    DROP POLICY IF EXISTS "Customers can send chat messages" ON public.chat_messages;
    CREATE POLICY "Customers can send chat messages"
    ON public.chat_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      session_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND sender_type = ANY (ARRAY['customer'::text, 'system'::text, 'admin'::text])
    );

    DROP POLICY IF EXISTS "Admins can read chat messages" ON public.chat_messages;
    CREATE POLICY "Admins can read chat messages"
    ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));

    DROP POLICY IF EXISTS "Admins can send chat messages" ON public.chat_messages;
    CREATE POLICY "Admins can send chat messages"
    ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

    DROP POLICY IF EXISTS "Admins can update chat messages" ON public.chat_messages;
    CREATE POLICY "Admins can update chat messages"
    ON public.chat_messages
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));

    DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;
    CREATE POLICY "Admins can delete chat messages"
    ON public.chat_messages
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  `);
  console.log('Configured chat_messages policies and grants');

  // Test insert and read
  const testSession = '11111111-2222-3333-4444-555555555555';
  await client.query(`
    INSERT INTO public.chat_messages (session_id, sender_type, message, customer_name, customer_phone)
    VALUES ($1, 'customer', 'Hello from test', 'Tester', '01700000000')
  `, [testSession]);

  const testRead = await client.query(`
    SELECT * FROM public.get_chat_messages($1)
  `, [testSession]);
  console.log('Test get_chat_messages output:', testRead.rows);

  // Clean up test message
  await client.query(`DELETE FROM public.chat_messages WHERE session_id = $1`, [testSession]);

  await client.end();
  console.log('Chat system fully verified and operational!');
}

run().catch(console.error);
