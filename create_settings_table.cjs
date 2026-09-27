const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO authenticated;
    GRANT ALL ON TABLE public.site_settings TO service_role;

    DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
    CREATE POLICY "Admins can manage site_settings"
    ON public.site_settings
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

    -- Insert default sender email if not set
    INSERT INTO public.site_settings (key, value)
    VALUES ('sender_email', 'Smart Digital Hub <onboarding@resend.dev>')
    ON CONFLICT (key) DO NOTHING;
  `);

  console.log('site_settings table created and configured!');
  await client.end();
}

run().catch(console.error);
