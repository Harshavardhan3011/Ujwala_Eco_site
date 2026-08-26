const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateTrigger() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Updating handle_new_user() trigger function in Postgres...');

  await client.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, email, phone, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        CASE 
          WHEN LOWER(COALESCE(NEW.raw_user_meta_data->>'role', '')) = 'admin' THEN 'admin'
          ELSE 'customer'
        END
      )
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          phone = EXCLUDED.phone;
      RETURN NEW;
    END;
    $$;
  `);

  console.log('Trigger handle_new_user() updated successfully.');
  await client.end();
}

updateTrigger().catch((err) => {
  console.error('Trigger update failed:', err);
  process.exit(1);
});
