import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

// Privileged Supabase client (if service role key is set)
export const getServiceRoleClient = () => {
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return null;
};

/**
 * Server-only privileged execution to upsert/update profiles bypassing RLS safely.
 */
export async function upsertAdminProfilePrivileged(params: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}): Promise<{ success: boolean; profile?: any; error?: string }> {
  const serviceClient = getServiceRoleClient();

  // Method 1: Use Supabase Service Role client if key is configured
  if (serviceClient) {
    try {
      const { data, error } = await serviceClient
        .from('profiles')
        .upsert({
          id: params.id,
          name: params.name,
          email: params.email.toLowerCase().trim(),
          phone: params.phone || null,
          role: 'admin',
          updated_at: new Date().toISOString(),
        })
        .select('id, name, email, phone, role, created_at')
        .single();

      if (!error && data) {
        return { success: true, profile: data };
      }
    } catch (err: any) {
      console.error('[SERVER_DB] Service role client error:', err.message);
    }
  }

  // Method 2: Direct server-only Postgres connection via SUPABASE_DB_URL (bypasses RLS as postgres user)
  if (dbUrl) {
    const pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgClient.connect();

      const query = `
        INSERT INTO public.profiles (id, name, email, phone, role, updated_at)
        VALUES ($1, $2, $3, $4, 'admin', NOW())
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            role = 'admin',
            updated_at = NOW()
        RETURNING id, name, email, phone, role, created_at;
      `;

      const res = await pgClient.query(query, [
        params.id,
        params.name,
        params.email.toLowerCase().trim(),
        params.phone || null,
      ]);

      await pgClient.end();

      if (res.rows && res.rows[0]) {
        return { success: true, profile: res.rows[0] };
      }
    } catch (err: any) {
      console.error('[SERVER_DB] Postgres direct query error:', err.message);
      try { await pgClient.end(); } catch {}
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Server-side privileged database execution unavailable' };
}

/**
 * Server-only privileged deletion of Auth user if provisioning fails
 */
export async function cleanupAuthUserPrivileged(userId: string): Promise<void> {
  const serviceClient = getServiceRoleClient();
  if (serviceClient) {
    try {
      await serviceClient.auth.admin.deleteUser(userId);
      return;
    } catch (err: any) {
      console.error('[SERVER_DB] Auth user cleanup error:', err.message);
    }
  }

  if (dbUrl) {
    const pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await pgClient.connect();
      await pgClient.query('DELETE FROM auth.users WHERE id = $1', [userId]);
      await pgClient.end();
    } catch (err: any) {
      console.error('[SERVER_DB] Auth user cleanup pg error:', err.message);
      try { await pgClient.end(); } catch {}
    }
  }
}
