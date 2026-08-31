import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const rawDbUrl = process.env.SUPABASE_DB_URL;

const connectionString = rawDbUrl;

// Global connection pool singleton across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __globalPgPool: Pool | undefined;
}

function getPgPool(): Pool | null {
  if (!connectionString) return null;

  if (!global.__globalPgPool) {
    global.__globalPgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    global.__globalPgPool.on('error', (err) => {
      console.error('[SERVER_DB] Unexpected PG pool error:', err.message);
    });
  }

  return global.__globalPgPool;
}

/**
 * Execute a parameterized query with server-level PostgreSQL privileges and automatic retry.
 */
export async function executePrivilegedQuery<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const pool = getPgPool();
  if (!pool) {
    throw new Error('Database connection URL (SUPABASE_DB_URL) is not configured on server');
  }

  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    let client;
    try {
      client = await pool.connect();
      const res = await client.query(text, params);
      return res.rows;
    } catch (err: any) {
      lastError = err;
      console.warn(`[SERVER_DB] Query attempt ${attempt} failed:`, err.message);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    } finally {
      if (client) {
        try { client.release(); } catch {}
      }
    }
  }

  throw lastError || new Error('Database query execution failed after retries');
}

/**
 * Execute a single-row parameterized query.
 */
export async function executePrivilegedQueryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await executePrivilegedQuery<T>(text, params);
  return rows[0] || null;
}

// Privileged Supabase client (if service role key is set)
export const getServiceRoleClient = () => {
  if (supabaseServiceKey && supabaseUrl) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return null;
};

// ==========================================
// 1. PRODUCT ADMINISTRATIVE CRUD
// ==========================================

export async function adminUpdateProduct(id: string, payload: any, images?: string[]) {
  const allowedFields = [
    'name', 'slug', 'sku', 'description', 'short_description', 'category_id',
    'price', 'discount_price', 'stock_quantity', 'min_order_quantity',
    'available_colors', 'available_sizes', 'material', 'dimensions', 'weight',
    'is_customizable', 'customization_details', 'product_status', 'is_featured',
    'is_bestseller', 'tags', 'seo_title', 'seo_description'
  ];

  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      params.push(payload[field]);
      paramIndex++;
    }
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const queryText = `
    UPDATE public.products
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  const updatedProduct = await executePrivilegedQueryOne(queryText, params);
  if (!updatedProduct) {
    throw new Error('Product not found or update failed');
  }

  // Handle product images if provided
  if (images && Array.isArray(images)) {
    await executePrivilegedQuery('DELETE FROM public.product_images WHERE product_id = $1;', [id]);
    for (let i = 0; i < images.length; i++) {
      await executePrivilegedQuery(
        `INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
         VALUES ($1, $2, $3, $4, $5);`,
        [id, images[i], `${updatedProduct.name} Image ${i + 1}`, i === 0, i]
      );
    }
  }

  // Return product with images & category
  const imagesList = await executePrivilegedQuery(
    'SELECT * FROM public.product_images WHERE product_id = $1 ORDER BY display_order ASC;',
    [id]
  );
  const category = updatedProduct.category_id
    ? await executePrivilegedQueryOne('SELECT * FROM public.categories WHERE id = $1;', [updatedProduct.category_id])
    : null;

  return {
    ...updatedProduct,
    images: imagesList,
    category,
  };
}

export async function adminCreateProduct(payload: any, images?: string[]) {
  const insertSql = `
    INSERT INTO public.products (
      name, slug, sku, description, short_description, category_id,
      price, discount_price, stock_quantity, min_order_quantity,
      available_colors, available_sizes, material, dimensions, weight,
      is_customizable, customization_details, product_status, is_featured,
      is_bestseller, tags, seo_title, seo_description
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21, $22, $23
    ) RETURNING *;
  `;

  const params = [
    payload.name,
    payload.slug,
    payload.sku,
    payload.description,
    payload.short_description || null,
    payload.category_id,
    payload.price,
    payload.discount_price || null,
    payload.stock_quantity || 0,
    payload.min_order_quantity || 1,
    payload.available_colors || null,
    payload.available_sizes || null,
    payload.material || null,
    payload.dimensions || null,
    payload.weight || null,
    Boolean(payload.is_customizable),
    payload.customization_details || null,
    payload.product_status || 'IN_STOCK',
    Boolean(payload.is_featured),
    Boolean(payload.is_bestseller),
    payload.tags || null,
    payload.seo_title || null,
    payload.seo_description || null,
  ];

  const product = await executePrivilegedQueryOne(insertSql, params);
  if (!product) throw new Error('Failed to insert product record');

  if (images && Array.isArray(images)) {
    for (let i = 0; i < images.length; i++) {
      await executePrivilegedQuery(
        `INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
         VALUES ($1, $2, $3, $4, $5);`,
        [product.id, images[i], `${product.name} Image ${i + 1}`, i === 0, i]
      );
    }
  }

  const imagesList = await executePrivilegedQuery(
    'SELECT * FROM public.product_images WHERE product_id = $1 ORDER BY display_order ASC;',
    [product.id]
  );
  return { ...product, images: imagesList };
}

export async function adminDeleteProduct(id: string) {
  await executePrivilegedQuery('DELETE FROM public.product_images WHERE product_id = $1;', [id]);
  await executePrivilegedQuery('DELETE FROM public.product_variants WHERE product_id = $1;', [id]);
  await executePrivilegedQuery('DELETE FROM public.products WHERE id = $1;', [id]);
  return true;
}

// ==========================================
// 2. CATEGORY ADMINISTRATIVE CRUD
// ==========================================

export async function adminGetCategories() {
  return executePrivilegedQuery(`
    SELECT c.*,
      COALESCE((SELECT COUNT(*)::int FROM public.products p WHERE p.category_id = c.id), 0) as product_count
    FROM public.categories c
    ORDER BY c.display_order ASC, c.name ASC;
  `);
}

export async function adminCreateCategory(payload: { name: string; slug: string; description?: string; image?: string; display_order?: number }) {
  return executePrivilegedQueryOne(`
    INSERT INTO public.categories (name, slug, description, image, display_order)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `, [payload.name, payload.slug, payload.description || null, payload.image || null, payload.display_order || 0]);
}

export async function adminUpdateCategory(id: string, payload: { name?: string; slug?: string; description?: string; image?: string; display_order?: number }) {
  const clauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (payload.name !== undefined) { clauses.push(`name = $${idx++}`); params.push(payload.name); }
  if (payload.slug !== undefined) { clauses.push(`slug = $${idx++}`); params.push(payload.slug); }
  if (payload.description !== undefined) { clauses.push(`description = $${idx++}`); params.push(payload.description); }
  if (payload.image !== undefined) { clauses.push(`image = $${idx++}`); params.push(payload.image); }
  if (payload.display_order !== undefined) { clauses.push(`display_order = $${idx++}`); params.push(payload.display_order); }

  clauses.push(`updated_at = NOW()`);
  params.push(id);

  return executePrivilegedQueryOne(`
    UPDATE public.categories
    SET ${clauses.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `, params);
}

export async function adminDeleteCategory(id: string) {
  await executePrivilegedQuery('DELETE FROM public.categories WHERE id = $1;', [id]);
  return true;
}

// ==========================================
// 3. ORDER ADMINISTRATIVE & CUSTOMER OPERATIONS
// ==========================================

export async function adminGetOrders(status?: string | null) {
  let query = `
    SELECT 
      o.*,
      COALESCE(
        (SELECT json_agg(oi.*) FROM public.order_items oi WHERE oi.order_id = o.id),
        '[]'::json
      ) as items,
      (SELECT row_to_json(p.*) FROM public.payments p WHERE p.order_id = o.id LIMIT 1) as payment,
      (SELECT json_build_object('name', pr.name, 'email', pr.email, 'phone', pr.phone) FROM public.profiles pr WHERE pr.id = o.user_id) as user
    FROM public.orders o
  `;

  const params: any[] = [];
  if (status) {
    query += ` WHERE o.order_status = $1`;
    params.push(status);
  }
  query += ` ORDER BY o.created_at DESC;`;

  return executePrivilegedQuery(query, params);
}

export async function adminGetOrderById(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const whereClause = isUuid ? `(o.id = $1::uuid OR o.order_number = $1)` : `o.order_number = $1`;

  const query = `
    SELECT 
      o.*,
      COALESCE(
        (SELECT json_agg(oi.*) FROM public.order_items oi WHERE oi.order_id = o.id),
        '[]'::json
      ) as items,
      (SELECT row_to_json(p.*) FROM public.payments p WHERE p.order_id = o.id LIMIT 1) as payment,
      (SELECT json_build_object('name', pr.name, 'email', pr.email, 'phone', pr.phone) FROM public.profiles pr WHERE pr.id = o.user_id) as user
    FROM public.orders o
    WHERE ${whereClause}
    LIMIT 1;
  `;

  return executePrivilegedQueryOne(query, [id]);
}

export async function adminUpdateOrder(id: string, payload: { orderStatus?: string; paymentStatus?: string }) {
  const clauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (payload.orderStatus) { clauses.push(`order_status = $${idx++}`); params.push(payload.orderStatus); }
  if (payload.paymentStatus) { clauses.push(`payment_status = $${idx++}`); params.push(payload.paymentStatus); }

  clauses.push(`updated_at = NOW()`);
  params.push(id);

  await executePrivilegedQuery(`
    UPDATE public.orders
    SET ${clauses.join(', ')}
    WHERE id = $${idx};
  `, params);

  return adminGetOrderById(id);
}

export async function customerGetOrders(userId: string) {
  return executePrivilegedQuery(`
    SELECT 
      o.*,
      COALESCE(
        (SELECT json_agg(oi.*) FROM public.order_items oi WHERE oi.order_id = o.id),
        '[]'::json
      ) as items,
      (SELECT row_to_json(p.*) FROM public.payments p WHERE p.order_id = o.id LIMIT 1) as payment
    FROM public.orders o
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC;
  `, [userId]);
}

// ==========================================
// 4. WISHLIST OPERATIONS
// ==========================================

export async function customerGetWishlist(userId: string) {
  return executePrivilegedQuery(`
    SELECT 
      w.*,
      row_to_json(p.*) as product,
      COALESCE((SELECT json_agg(pi.*) FROM public.product_images pi WHERE pi.product_id = p.id), '[]'::json) as images
    FROM public.wishlist_items w
    JOIN public.products p ON p.id = w.product_id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC;
  `, [userId]);
}

export async function customerToggleWishlist(userId: string, productId: string) {
  const existing = await executePrivilegedQueryOne(
    'SELECT id FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2;',
    [userId, productId]
  );

  if (existing) {
    await executePrivilegedQuery('DELETE FROM public.wishlist_items WHERE id = $1;', [existing.id]);
    return { inWishlist: false, message: 'Removed from wishlist' };
  } else {
    await executePrivilegedQuery(
      'INSERT INTO public.wishlist_items (user_id, product_id) VALUES ($1, $2);',
      [userId, productId]
    );
    return { inWishlist: true, message: 'Added to wishlist' };
  }
}

// ==========================================
// 5. SITE SETTINGS & REVIEWS & CUSTOM ORDERS
// ==========================================

export async function adminGetSiteSettings() {
  return executePrivilegedQuery('SELECT * FROM public.site_settings;');
}

export async function adminUpsertSiteSetting(key: string, value: string) {
  return executePrivilegedQueryOne(`
    INSERT INTO public.site_settings (key, value, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
    RETURNING *;
  `, [key, value]);
}

export async function adminGetCustomOrders() {
  return executePrivilegedQuery('SELECT * FROM public.custom_orders ORDER BY created_at DESC;');
}

export async function adminUpdateCustomOrder(id: string, status: string) {
  return executePrivilegedQueryOne(`
    UPDATE public.custom_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;
  `, [status, id]);
}

export async function adminDeleteCustomOrder(id: string) {
  await executePrivilegedQuery('DELETE FROM public.custom_orders WHERE id = $1;', [id]);
  return true;
}

export async function adminGetReviews() {
  return executePrivilegedQuery(`
    SELECT r.*, p.name as product_name
    FROM public.reviews r
    LEFT JOIN public.products p ON p.id = r.product_id
    ORDER BY r.created_at DESC;
  `);
}

export async function adminUpdateReview(id: string, isApproved: boolean) {
  return executePrivilegedQueryOne(`
    UPDATE public.reviews SET is_approved = $1 WHERE id = $2 RETURNING *;
  `, [isApproved, id]);
}

export async function adminDeleteReview(id: string) {
  await executePrivilegedQuery('DELETE FROM public.reviews WHERE id = $1;', [id]);
  return true;
}

// ==========================================
// 6. USER MANAGEMENT (SUPERADMIN PRIVILEGED)
// ==========================================

export async function getAdminUsersPrivileged(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  try {
    const users = await executePrivilegedQuery(`
      SELECT id, name, email, phone, role, created_at, updated_at
      FROM public.profiles
      WHERE LOWER(role) IN ('admin', 'superadmin')
      ORDER BY created_at DESC;
    `);
    return { success: true, users };
  } catch (err: any) {
    console.error('[SERVER_DB] getAdminUsersPrivileged error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function createAdminAuthUserPrivileged(params: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const cleanEmail = params.email.toLowerCase().trim();

  try {
    // Check if email already exists in auth.users
    const existing = await executePrivilegedQueryOne(
      'SELECT id FROM auth.users WHERE LOWER(email) = $1 LIMIT 1;',
      [cleanEmail]
    );

    if (existing) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // 1. Create user in auth.users
    const createUserRes = await executePrivilegedQueryOne<{ id: string }>(
      `INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', $1, crypt($2, gen_salt('bf', 10)), NOW(),
        '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('name', $3::text, 'phone', $4::text, 'role', 'admin')::jsonb,
        NOW(), NOW(), 'authenticated', 'authenticated'
      ) RETURNING id;`,
      [cleanEmail, params.password, params.name || '', params.phone || '']
    );

    if (!createUserRes) {
      return { success: false, error: 'Failed to insert auth user record' };
    }

    const userId = createUserRes.id;

    // 2. Create identity in auth.identities
    await executePrivilegedQuery(
      `INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $1::text,
        json_build_object('sub', $1::text, 'email', $2::text, 'email_verified', false, 'phone_verified', false)::jsonb,
        'email', NOW(), NOW(), NOW()
      );`,
      [userId, cleanEmail]
    );

    return { success: true, userId };
  } catch (err: any) {
    console.error('[SERVER_DB] createAdminAuthUser error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function upsertAdminProfilePrivileged(params: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}): Promise<{ success: boolean; profile?: any; error?: string }> {
  const cleanEmail = params.email.toLowerCase().trim();

  try {
    const profile = await executePrivilegedQueryOne(`
      INSERT INTO public.profiles (id, name, email, phone, role, updated_at)
      VALUES ($1, $2, $3, $4, 'admin', NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = 'admin',
          updated_at = NOW()
      RETURNING id, name, email, phone, role, created_at, updated_at;
    `, [params.id, params.name, cleanEmail, params.phone || null]);

    if (!profile) return { success: false, error: 'Failed to upsert admin profile' };
    return { success: true, profile };
  } catch (err: any) {
    console.error('[SERVER_DB] upsertAdminProfile error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteAdminUserPrivileged(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await executePrivilegedQuery('DELETE FROM public.profiles WHERE id = $1;', [userId]);
    await executePrivilegedQuery('DELETE FROM auth.identities WHERE user_id = $1;', [userId]);
    await executePrivilegedQuery('DELETE FROM auth.users WHERE id = $1;', [userId]);
    return { success: true };
  } catch (err: any) {
    console.error('[SERVER_DB] deleteAdminUser error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function cleanupAuthUserPrivileged(userId: string): Promise<void> {
  await deleteAdminUserPrivileged(userId);
}
