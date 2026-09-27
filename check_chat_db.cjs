const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log('Public tables:', tables.rows.map(r => r.table_name));

  const funcs = await client.query(
    "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'"
  );
  console.log('Public routines:', funcs.rows.map(r => r.routine_name));
  
  await client.end();
}

run().catch(console.error);
