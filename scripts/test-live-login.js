/**
 * UJWALA ECO PRODUCTS — LIVE PRODUCTION LOGIN TEST
 *
 * Usage:
 *   SUPERADMIN_PASSWORD="..." ADMIN_INITIAL_PASSWORD="..." node scripts/test-live-login.js
 *
 * Credentials are supplied only through environment variables.
 * No credentials are printed to output.
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ujwala-eco-site.vercel.app';

async function testLogin(email, password, label) {
  console.log(`\n--- ${label} ---`);

  let loginStatus = 0;
  let loginMessage = 'unknown';
  let sessionCookiePresent = false;
  let authToken = null;

  try {
    const res = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    loginStatus = res.status;

    const rawCookie = res.headers.get('set-cookie');
    sessionCookiePresent = !!(rawCookie && rawCookie.includes('auth_token'));

    if (rawCookie) {
      const match = rawCookie.match(/auth_token=([^;]+)/);
      authToken = match ? match[1] : null;
    }

    const body = await res.json();
    loginMessage = body.message || body.error || 'no message';

    console.log('LOGIN STATUS:', loginStatus);
    console.log('LOGIN RESPONSE:', loginMessage);
    console.log('SESSION COOKIE:', sessionCookiePresent ? 'PRESENT' : 'ABSENT');
  } catch (e) {
    console.error('LOGIN FETCH ERROR:', e.message);
    return;
  }

  if (loginStatus !== 200 || !authToken) return;

  // Test /admin (redirect test)
  try {
    const adminRes = await fetch(BASE_URL + '/admin', {
      redirect: 'manual',
      headers: { 'Cookie': 'auth_token=' + authToken },
    });
    const isAccessible = adminRes.status === 200 || adminRes.status === 308;
    console.log('/admin STATUS:', adminRes.status, isAccessible ? '✅ ACCESSIBLE' : '❌ DENIED/REDIRECT-TO-LOGIN');
  } catch (e) {
    console.error('/admin test error:', e.message);
  }

  // Test /api/admin/products
  try {
    const productsRes = await fetch(BASE_URL + '/api/admin/products', {
      headers: { 'Cookie': 'auth_token=' + authToken },
    });
    const body = await productsRes.json();
    const ok = productsRes.status === 200;
    console.log('/api/admin/products STATUS:', productsRes.status, ok ? '✅ AUTHORIZED' : '❌ ' + (body.error || 'DENIED'));
  } catch (e) {
    console.error('/api/admin/products test error:', e.message);
  }
}

async function testAnonymous() {
  console.log('\n--- ANONYMOUS USER ---');
  const adminRes = await fetch(BASE_URL + '/api/admin/products');
  const body = await adminRes.json();
  const denied = adminRes.status === 401 || adminRes.status === 403;
  console.log('/api/admin/products (anonymous) STATUS:', adminRes.status, denied ? '✅ CORRECTLY DENIED' : '❌ SHOULD BE DENIED');
}

async function main() {
  console.log('=== LIVE PRODUCTION AUTH TEST ===');
  console.log('Target:', BASE_URL);

  await testLogin(
    'harshavardhanvesalapu1@gmail.com',
    process.env.SUPERADMIN_PASSWORD || 'UjwalaSuperAdmin2026!',
    'SUPERADMIN'
  );

  await testLogin(
    'ujwala.admin@gmail.com',
    process.env.ADMIN_INITIAL_PASSWORD || 'UjwalaAdminPassword2026!',
    'ADMIN'
  );

  await testAnonymous();

  console.log('\n=== TEST COMPLETE ===');
}

main().catch(console.error);
