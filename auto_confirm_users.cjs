const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.eybsbcaoboispmzuvjkw:%24500200100%40Shorna@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB...');

  // 1. Confirm any existing unconfirmed users
  await client.query(`
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE email_confirmed_at IS NULL;
  `);
  console.log('Confirmed existing users');

  // 2. Create trigger to auto-confirm new users
  await client.query(`
    CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
    CREATE TRIGGER on_auth_user_created_confirm
      BEFORE INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_confirm_new_user();
  `);
  console.log('Created auto_confirm_new_user trigger on auth.users!');

  await client.end();
  console.log('Instant verification-free sign up is now active!');
}

run().catch(console.error);
