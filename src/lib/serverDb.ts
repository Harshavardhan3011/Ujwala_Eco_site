import { Pool, PoolClient } from 'pg';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const connectionString = process.env.SUPABASE_DB_URL;

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
    let client: PoolClient | undefined;
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

/**
 * Execute a multi-statement transaction with automatic rollback on error.
 */
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPgPool();
  if (!pool) {
    throw new Error('Database connection URL (SUPABASE_DB_URL) is not configured on server');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

  return withTransaction(async (client) => {
    const updateRes = await client.query(queryText, params);
    const updatedProduct = updateRes.rows[0];
    if (!updatedProduct) {
      throw new Error('Product not found or update failed');
    }

    // Handle product images transactionally
    if (images && Array.isArray(images)) {
      await client.query('DELETE FROM public.product_images WHERE product_id = $1;', [id]);
      for (let i = 0; i < images.length; i++) {
        await client.query(
          `INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
           VALUES ($1, $2, $3, $4, $5);`,
          [id, images[i], `${updatedProduct.name} Image ${i + 1}`, i === 0, i]
        );
      }
    }

    const imagesRes = await client.query(
      'SELECT * FROM public.product_images WHERE product_id = $1 ORDER BY display_order ASC;',
      [id]
    );

    const categoryRes = updatedProduct.category_id
      ? await client.query('SELECT * FROM public.categories WHERE id = $1;', [updatedProduct.category_id])
      : { rows: [] };

    return {
      ...updatedProduct,
      images: imagesRes.rows,
      category: categoryRes.rows[0] || null,
    };
  });
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

  return withTransaction(async (client) => {
    const insertRes = await client.query(insertSql, params);
    const product = insertRes.rows[0];
    if (!product) throw new Error('Failed to insert product record');

    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        await client.query(
          `INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
           VALUES ($1, $2, $3, $4, $5);`,
          [product.id, images[i], `${product.name} Image ${i + 1}`, i === 0, i]
        );
      }
    }

    const imagesRes = await client.query(
      'SELECT * FROM public.product_images WHERE product_id = $1 ORDER BY display_order ASC;',
      [product.id]
    );

    return { ...product, images: imagesRes.rows };
  });
}

export async function adminDeleteProduct(id: string) {
  return withTransaction(async (client) => {
    await client.query('DELETE FROM public.product_images WHERE product_id = $1;', [id]);
    await client.query('DELETE FROM public.product_variants WHERE product_id = $1;', [id]);
    await client.query('DELETE FROM public.products WHERE id = $1;', [id]);
    return true;
  });
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
// 3B. ORDER REQUEST OPERATIONS (EMAIL WORKFLOW)
// ==========================================

export interface CreateOrderRequestPayload {
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  customerNotes?: string | null;
  customizationNotes?: string | null;
  items: {
    productId: string;
    quantity: number;
    customizationNotes?: string | null;
  }[];
}

export async function createOrderRequestPrivileged(payload: CreateOrderRequestPayload) {
  return withTransaction(async (client) => {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Order request must contain at least one item');
    }

    // 1. Fetch products & validate stock/active
    const productIds = payload.items.map(i => i.productId);
    const prodRes = await client.query(
      `SELECT id, name, sku, price, discount_price, stock_quantity, product_status FROM public.products WHERE id = ANY($1::uuid[]);`,
      [productIds]
    );

    const productMap = new Map<string, any>();
    prodRes.rows.forEach(p => productMap.set(p.id, p));

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of payload.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (prod.product_status && prod.product_status !== 'ACTIVE') {
        throw new Error(`Product is no longer available: ${prod.name}`);
      }
      if (item.quantity < 1) {
        throw new Error(`Invalid quantity for ${prod.name}. Minimum is 1.`);
      }
      if (item.quantity > prod.stock_quantity) {
        throw new Error(`Insufficient stock for "${prod.name}". Only ${prod.stock_quantity} available.`);
      }

      const unitPrice = parseFloat(prod.discount_price ?? prod.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        sku: prod.sku || 'UJW-PROD',
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        customizationNotes: item.customizationNotes || payload.customizationNotes || null,
      });
    }

    // 2. Calculate centralized delivery fee: Free above ₹1000 else ₹50
    const deliveryCharge = subtotal >= 1000 ? 0 : 50;
    const totalAmount = subtotal + deliveryCharge;

    // 3. Generate human readable reference number
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const requestNumber = `UJW-${today}-${randCode}`;

    // 4. Insert into order_requests
    const reqRes = await client.query(
      `INSERT INTO public.order_requests (
        request_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country,
        subtotal, delivery_charge, total_amount, status, customer_notes, customization_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING_CONFIRMATION', $14, $15)
      RETURNING *;`,
      [
        requestNumber,
        payload.customerId || null,
        payload.customerName.trim(),
        payload.customerEmail.trim().toLowerCase(),
        payload.customerPhone.trim(),
        payload.shippingAddress.trim(),
        payload.shippingCity.trim(),
        payload.shippingState.trim(),
        payload.shippingPostalCode.trim(),
        (payload.shippingCountry || 'India').trim(),
        subtotal,
        deliveryCharge,
        totalAmount,
        payload.customerNotes || null,
        payload.customizationNotes || null,
      ]
    );

    const orderRequest = reqRes.rows[0];

    // 5. Insert order_request_items snapshots
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO public.order_request_items (
          request_id, product_id, product_name_snapshot, sku_snapshot,
          quantity, unit_price, line_total, customization_snapshot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          orderRequest.id,
          item.productId,
          item.name,
          item.sku,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
          item.customizationNotes,
        ]
      );
    }

    return {
      ...orderRequest,
      items: validatedItems,
    };
  });
}

export async function adminGetOrderRequests(status?: string | null) {
  let query = `
    SELECT 
      r.*,
      COALESCE(
        (SELECT json_agg(ri.*) FROM public.order_request_items ri WHERE ri.request_id = r.id),
        '[]'::json
      ) as items
    FROM public.order_requests r
  `;

  const params: any[] = [];
  if (status) {
    query += ` WHERE r.status = $1`;
    params.push(status);
  }
  query += ` ORDER BY r.created_at DESC;`;

  return executePrivilegedQuery(query, params);
}

export async function adminGetOrderRequestById(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const whereClause = isUuid ? `(r.id = $1::uuid OR r.request_number = $1)` : `r.request_number = $1`;

  const query = `
    SELECT 
      r.*,
      COALESCE(
        (SELECT json_agg(ri.*) FROM public.order_request_items ri WHERE ri.request_id = r.id),
        '[]'::json
      ) as items
    FROM public.order_requests r
    WHERE ${whereClause}
    LIMIT 1;
  `;

  return executePrivilegedQueryOne(query, [id]);
}

export async function adminUpdateOrderRequestStatus(
  id: string,
  status: string,
  emailSent?: boolean,
  emailError?: string
) {
  const clauses = ['status = $1', 'updated_at = NOW()'];
  const params: any[] = [status];
  let idx = 2;

  if (emailSent !== undefined) {
    clauses.push(`email_sent = $${idx++}`);
    params.push(emailSent);
  }
  if (emailError !== undefined) {
    clauses.push(`email_error = $${idx++}`);
    params.push(emailError);
  }

  params.push(id);

  await executePrivilegedQuery(
    `UPDATE public.order_requests SET ${clauses.join(', ')} WHERE id = $${idx};`,
    params
  );

  return adminGetOrderRequestById(id);
}

export async function adminConvertOrderRequestToOrder(requestId: string, finalConfirmedTotal?: number) {
  return withTransaction(async (client) => {
    const reqRes = await client.query('SELECT * FROM public.order_requests WHERE id = $1 FOR UPDATE;', [requestId]);
    const req = reqRes.rows[0];
    if (!req) throw new Error('Order request not found');

    if (req.confirmed_order_id) {
      throw new Error('This order request has already been converted to an order');
    }

    const itemsRes = await client.query('SELECT * FROM public.order_request_items WHERE request_id = $1;', [requestId]);
    const items = itemsRes.rows;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const finalTotal = finalConfirmedTotal ?? parseFloat(req.total_amount);

    // 1. Create Confirmed Order
    const newOrderRes = await client.query(
      `INSERT INTO public.orders (
        order_number, user_id, shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_postal_code,
        subtotal, shipping_fee, tax, total_amount, order_status, payment_status, payment_method, customization_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, 'CONFIRMED', 'PENDING', 'DIRECT_INVOICE', $12)
      RETURNING *;`,
      [
        orderNumber,
        req.customer_id || null,
        req.customer_name,
        req.customer_phone,
        req.shipping_address,
        req.shipping_city,
        req.shipping_state,
        req.shipping_postal_code,
        req.subtotal,
        req.delivery_charge,
        finalTotal,
        `Converted from Request #${req.request_number}. ${req.customer_notes || ''}`,
      ]
    );

    const createdOrder = newOrderRes.rows[0];

    // 2. Insert order_items
    for (const item of items) {
      await client.query(
        `INSERT INTO public.order_items (order_id, product_id, product_name, product_sku, price, quantity, customization_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          createdOrder.id,
          item.product_id,
          item.product_name_snapshot,
          item.sku_snapshot,
          item.unit_price,
          item.quantity,
          item.customization_snapshot,
        ]
      );
    }

    // 3. Update order_requests with confirmed_order_id & final_confirmed_total
    await client.query(
      `UPDATE public.order_requests
       SET confirmed_order_id = $1, final_confirmed_total = $2, status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $3;`,
      [createdOrder.id, finalTotal, requestId]
    );

    return {
      order: createdOrder,
      orderRequest: req,
    };
  });
}

export async function customerGetOrderRequests(userId: string) {
  return executePrivilegedQuery(`
    SELECT 
      r.*,
      COALESCE(
        (SELECT json_agg(ri.*) FROM public.order_request_items ri WHERE ri.request_id = r.id),
        '[]'::json
      ) as items
    FROM public.order_requests r
    WHERE r.customer_id = $1
    ORDER BY r.created_at DESC;
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
  return withTransaction(async (client) => {
    const existing = await client.query(
      'SELECT id FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2;',
      [userId, productId]
    );

    if (existing.rows && existing.rows.length > 0) {
      await client.query('DELETE FROM public.wishlist_items WHERE id = $1;', [existing.rows[0].id]);
      return { inWishlist: false, message: 'Removed from wishlist' };
    } else {
      await client.query(
        'INSERT INTO public.wishlist_items (user_id, product_id) VALUES ($1, $2);',
        [userId, productId]
      );
      return { inWishlist: true, message: 'Added to wishlist' };
    }
  });
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
    return await withTransaction(async (client) => {
      // Check if email already exists in auth.users
      const existing = await client.query(
        'SELECT id FROM auth.users WHERE LOWER(email) = $1 LIMIT 1;',
        [cleanEmail]
      );

      if (existing.rows && existing.rows.length > 0) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // 1. Create user in auth.users
      const createUserRes = await client.query(
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

      const userId = createUserRes.rows[0].id;

      // 2. Create identity in auth.identities
      await client.query(
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
    });
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
    return await withTransaction(async (client) => {
      await client.query('DELETE FROM public.profiles WHERE id = $1;', [userId]);
      await client.query('DELETE FROM auth.identities WHERE user_id = $1;', [userId]);
      await client.query('DELETE FROM auth.users WHERE id = $1;', [userId]);
      return { success: true };
    });
  } catch (err: any) {
    console.error('[SERVER_DB] deleteAdminUser error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function cleanupAuthUserPrivileged(userId: string): Promise<void> {
  await deleteAdminUserPrivileged(userId);
}
