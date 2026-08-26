import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const rawDbUrl = process.env.SUPABASE_DB_URL;

function getValidConnectionString(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes('db.ujkhgvhqofdbqwgahslc.supabase.co')) {
    return url
      .replace('db.ujkhgvhqofdbqwgahslc.supabase.co', 'aws-0-ap-south-1.pooler.supabase.com')
      .replace('postgres:', 'postgres.ujkhgvhqofdbqwgahslc:');
  }
  return url;
}

const dbUrl = getValidConnectionString(rawDbUrl);

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
 * Server-only privileged query to list all admin and superadmin users safely bypassing RLS.
 */
export async function getAdminUsersPrivileged(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  const serviceClient = getServiceRoleClient();

  if (serviceClient) {
    try {
      const { data, error } = await serviceClient
        .from('profiles')
        .select('id, name, email, phone, role, created_at, updated_at')
        .in('role', ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        return { success: true, users: data };
      }
    } catch (err: any) {
      console.error('[SERVER_DB] Service role getAdminUsers error:', err.message);
    }
  }

  if (dbUrl) {
    const pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgClient.connect();

      const query = `
        SELECT id, name, email, phone, role, created_at, updated_at
        FROM public.profiles
        WHERE LOWER(role) IN ('admin', 'superadmin')
        ORDER BY created_at DESC;
      `;

      const res = await pgClient.query(query);
      await pgClient.end();

      return { success: true, users: res.rows || [] };
    } catch (err: any) {
      console.error('[SERVER_DB] Postgres direct getAdminUsers error:', err.message);
      try { await pgClient.end(); } catch {}
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Server-side privileged database execution unavailable' };
}

/**
 * Server-only privileged creation of Auth user using Supabase Admin Auth API or direct Postgres execution.
 */
export async function createAdminAuthUserPrivileged(params: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const cleanEmail = params.email.toLowerCase().trim();
  const serviceClient = getServiceRoleClient();

  // Method 1: Supabase Service Role client if key is configured
  if (serviceClient) {
    try {
      const { data, error } = await serviceClient.auth.admin.createUser({
        email: cleanEmail,
        password: params.password,
        email_confirm: true,
        user_metadata: {
          name: params.name,
          phone: params.phone || null,
          role: 'admin',
        },
      });

      if (!error && data.user) {
        return { success: true, userId: data.user.id };
      }

      if (error) {
        console.error('[SERVER_DB] Service role createUser error:', error.message);
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return { success: false, error: 'An account with this email already exists' };
        }
      }
    } catch (err: any) {
      console.error('[SERVER_DB] Service role createUser exception:', err.message);
    }
  }

  // Method 2: Direct Postgres execution via SUPABASE_DB_URL
  if (dbUrl) {
    const pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgClient.connect();

      // Check if email already exists
      const existingUser = await pgClient.query(
        'SELECT id FROM auth.users WHERE LOWER(email) = $1',
        [cleanEmail]
      );

      if (existingUser.rows && existingUser.rows.length > 0) {
        await pgClient.end();
        return { success: false, error: 'An account with this email already exists' };
      }

      // 1. Create user in auth.users
      const createUserRes = await pgClient.query(
        `INSERT INTO auth.users (
          id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud
        ) VALUES (
          gen_random_uuid(), '00000000-0000-0000-0000-000000000000', $1, crypt($2, gen_salt('bf')), NOW(),
          json_build_object('name', $3, 'phone', $4, 'role', 'admin')::jsonb,
          NOW(), NOW(), 'authenticated', 'authenticated'
        ) RETURNING id;`,
        [cleanEmail, params.password, params.name, params.phone || null]
      );

      const userId = createUserRes.rows[0].id;

      // 2. Create identity in auth.identities
      await pgClient.query(
        `INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::uuid, $1::text, json_build_object('sub', $1::text, 'email', $2::text), 'email', NOW(), NOW(), NOW()
        );`,
        [userId, cleanEmail]
      );

      await pgClient.end();
      return { success: true, userId };
    } catch (err: any) {
      console.error('[SERVER_DB] Postgres direct createUser error:', err.message);
      try { await pgClient.end(); } catch {}
      return { success: false, error: err.message };
    }
  }

  // Method 3: Fallback using public client signUp
  try {
    const publicClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data, error } = await publicClient.auth.signUp({
      email: cleanEmail,
      password: params.password,
      options: {
        data: {
          name: params.name,
          phone: params.phone || null,
          role: 'admin',
        },
      },
    });

    if (!error && data.user) {
      return { success: true, userId: data.user.id };
    }

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return { success: false, error: 'An account with this email already exists' };
      }
      return { success: false, error: error.message };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  return { success: false, error: 'Unable to create administrator authentication account' };
}

/**
 * Server-only privileged execution to upsert/update profiles bypassing RLS safely.
 */
export async function upsertAdminProfilePrivileged(params: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}): Promise<{ success: boolean; profile?: any; error?: string }> {
  const cleanEmail = params.email.toLowerCase().trim();
  const serviceClient = getServiceRoleClient();

  if (serviceClient) {
    try {
      const { data, error } = await serviceClient
        .from('profiles')
        .upsert({
          id: params.id,
          name: params.name,
          email: cleanEmail,
          phone: params.phone || null,
          role: 'admin',
          updated_at: new Date().toISOString(),
        })
        .select('id, name, email, phone, role, created_at, updated_at')
        .single();

      if (!error && data) {
        return { success: true, profile: data };
      }
    } catch (err: any) {
      console.error('[SERVER_DB] Service role client error:', err.message);
    }
  }

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
        RETURNING id, name, email, phone, role, created_at, updated_at;
      `;

      const res = await pgClient.query(query, [
        params.id,
        params.name,
        cleanEmail,
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
 * Server-only privileged deletion of Auth user and Profile
 */
export async function deleteAdminUserPrivileged(userId: string): Promise<{ success: boolean; error?: string }> {
  const serviceClient = getServiceRoleClient();

  if (serviceClient) {
    try {
      await serviceClient.from('profiles').delete().eq('id', userId);
      const { error } = await serviceClient.auth.admin.deleteUser(userId);
      if (!error) return { success: true };
    } catch (err: any) {
      console.error('[SERVER_DB] Service role delete error:', err.message);
    }
  }

  if (dbUrl) {
    const pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgClient.connect();
      await pgClient.query('DELETE FROM public.profiles WHERE id = $1', [userId]);
      await pgClient.query('DELETE FROM auth.identities WHERE user_id = $1', [userId]);
      await pgClient.query('DELETE FROM auth.users WHERE id = $1', [userId]);
      await pgClient.end();
      return { success: true };
    } catch (err: any) {
      console.error('[SERVER_DB] Postgres direct delete error:', err.message);
      try { await pgClient.end(); } catch {}
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Failed to delete administrator user' };
}

export async function cleanupAuthUserPrivileged(userId: string): Promise<void> {
  await deleteAdminUserPrivileged(userId);
}
