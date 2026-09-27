const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB...');

  const methods = await client.query('SELECT * FROM public.payment_methods');
  console.log('Payment methods in DB:', methods.rows);

  const policies = await client.query(`
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'payment_methods'
  `);
  console.log('Payment methods policies:', policies.rows);

  const grants = await client.query(`
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name = 'payment_methods'
  `);
  console.log('Payment methods grants:', grants.rows);

  await client.end();
}

run().catch(console.error);
