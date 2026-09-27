const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  
  await client.query(
    "UPDATE public.banners SET title = $1, image_url = $2 WHERE is_active = true",
    ['Smart Digital Hub Official', '/smart-digital-hub-banner.svg']
  );

  const res = await client.query('SELECT * FROM public.banners');
  console.log('Updated banners in DB:', res.rows);
  
  await client.end();
}

run().catch(console.error);
