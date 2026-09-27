const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to Postgres...');

  const columns = ['name', 'description', 'short_description', 'long_description', 'seo_title', 'meta_description', 'focus_keywords'];
  
  for (const col of columns) {
    const query = `UPDATE public.products 
      SET ${col} = REPLACE(REPLACE(REPLACE(REPLACE(${col}, 'TechSubxBD', 'Smart Digital Hub'), 'TechsubxBD', 'Smart Digital Hub'), 'TechSubx', 'Smart Digital Hub'), 'techsubxbd', 'Smart Digital Hub') 
      WHERE ${col} ILIKE '%techsub%'`;
    const res = await client.query(query);
    console.log(`Updated ${col}: ${res.rowCount} rows`);
  }

  // Update banners
  const bRes = await client.query(`UPDATE public.banners 
    SET title = REPLACE(REPLACE(title, 'TechSubx', 'Smart Digital Hub'), 'TechsubxBD', 'Smart Digital Hub') 
    WHERE title ILIKE '%techsub%'`);
  console.log(`Updated banners: ${bRes.rowCount} rows`);

  // Let's also check what banner images exist
  const allBanners = await client.query('SELECT * FROM public.banners');
  console.log('Current banners in DB:', allBanners.rows);

  await client.end();
  console.log('Database brand update complete!');
}

run().catch(console.error);
