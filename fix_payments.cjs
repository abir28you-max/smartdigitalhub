const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB...');

  // 1. Ensure table structure
  await client.query(`
    ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS holder_name text;
    ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS branch text;
    ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS logo_url text;
    ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
  `);
  console.log('Ensured payment_methods columns');

  // 2. Create get_payment_methods RPC
  await client.query(`
    CREATE OR REPLACE FUNCTION public.get_payment_methods()
    RETURNS TABLE(id uuid, name text, logo_url text, instructions text)
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT p.id, p.name, p.logo_url, p.instructions
      FROM public.payment_methods p
      WHERE p.is_active = true
      ORDER BY p.sort_order ASC, p.created_at ASC;
    $$;
  `);

  await client.query(`
    REVOKE ALL ON FUNCTION public.get_payment_methods() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.get_payment_methods() TO anon, authenticated, service_role;
  `);
  console.log('Created get_payment_methods RPC');

  // 3. Create get_payment_account RPC
  await client.query(`
    CREATE OR REPLACE FUNCTION public.get_payment_account(p_id uuid)
    RETURNS TABLE(account_number text, holder_name text, branch text)
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT p.account_number, p.holder_name, p.branch
      FROM public.payment_methods p
      WHERE p.id = p_id AND p.is_active = true;
    $$;
  `);

  await client.query(`
    REVOKE ALL ON FUNCTION public.get_payment_account(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.get_payment_account(uuid) TO anon, authenticated, service_role;
  `);
  console.log('Created get_payment_account RPC');

  // 4. Test calling both RPCs
  const methods = await client.query('SELECT * FROM public.get_payment_methods()');
  console.log('get_payment_methods output:', methods.rows);

  if (methods.rows.length > 0) {
    const acc = await client.query('SELECT * FROM public.get_payment_account($1)', [methods.rows[0].id]);
    console.log('get_payment_account output for first method:', acc.rows);
  }

  await client.end();
  console.log('Payment methods system successfully activated and tested!');
}

run().catch(console.error);
