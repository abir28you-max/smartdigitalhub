const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB...');

  // Check current columns
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders'
  `);
  console.log('Current orders columns:', cols.rows.map(c => `${c.column_name} (${c.data_type})`));

  // Add missing columns to orders
  await client.query(`
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_notes JSONB DEFAULT NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT DEFAULT NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) NOT NULL DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '';
  `);
  console.log('Added missing columns to orders');

  // Also check products table
  await client.query(`
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_delivery_details BOOLEAN NOT NULL DEFAULT false;
  `);

  // Ensure RLS policies on orders
  await client.query(`
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
    GRANT INSERT, SELECT ON TABLE public.orders TO anon;
    GRANT ALL ON TABLE public.orders TO service_role;

    DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
    DROP POLICY IF EXISTS "Anyone can create valid orders" ON public.orders;
    DROP POLICY IF EXISTS "Signed-in users can create their own orders" ON public.orders;
    
    CREATE POLICY "Users can create orders"
    ON public.orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
    CREATE POLICY "Users can read own orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

    DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
    CREATE POLICY "Admins can manage orders"
    ON public.orders
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  `);
  console.log('Updated orders RLS policies');

  // Reload PostgREST schema cache
  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log('Reloaded PostgREST schema cache!');

  // Test insert a dummy order to verify
  const testRes = await client.query(`
    INSERT INTO public.orders (customer_name, customer_phone, total_price, status, items, delivery_details)
    VALUES ('Schema Test', '01700000000', 100, 'pending', '[{"name":"Test Product"}]'::jsonb, '[{"name":"Tester"}]'::jsonb)
    RETURNING id;
  `);
  console.log('Test order inserted successfully with ID:', testRes.rows[0].id);

  // Clean up test order
  await client.query(`DELETE FROM public.orders WHERE id = $1`, [testRes.rows[0].id]);

  await client.end();
  console.log('Orders table fully verified and ready!');
}

run().catch(console.error);
