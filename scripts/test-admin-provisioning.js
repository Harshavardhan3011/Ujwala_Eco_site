const { jwtVerify } = require('jose');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ujwala-eco-site.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET || 'ujwala_eco_products_secret_2026';

async function runTests() {
  console.log('=== ADMIN PROVISIONING & SECURITY TEST SUITE ===');

  const testEmail = `test.admin.${Date.now()}@ujwalaeco.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test Operational Admin';

  // 1. Test Anonymous Request to Create Admin
  console.log('\n--- TEST 4: Anonymous Request to Create Admin ---');
  try {
    const anonRes = await fetch(`${BASE_URL}/api/superadmin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    console.log(`Anon Status: ${anonRes.status} (Expected 401 or 403)`);
    if (anonRes.status === 401 || anonRes.status === 403) {
      console.log('✅ TEST 4 PASSED: Anonymous request correctly denied.');
    } else {
      console.error(`❌ TEST 4 FAILED: Unexpected status ${anonRes.status}`);
    }
  } catch (err) {
    console.error('TEST 4 Error:', err.message);
  }

  // 2. Test Superadmin login to perform privileged operations
  console.log('\n--- SUPERADMIN AUTHENTICATION ---');
  const superadminEmail = process.env.ADMIN_EMAIL || 'harshavardhanvesalapu1@gmail.com';
  const superadminPass = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || 'UjwalaSuperAdmin2026!';

  let superadminCookie = '';
  try {
    const saLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: superadminEmail, password: superadminPass }),
    });
    const setCookie = saLoginRes.headers.get('set-cookie');
    if (setCookie) {
      superadminCookie = setCookie.split(';')[0];
    }
    console.log(`Superadmin Login Status: ${saLoginRes.status}`);
  } catch (err) {
    console.error('Superadmin login failed:', err.message);
  }

  if (!superadminCookie) {
    console.error('❌ Cannot proceed without superadmin session cookie.');
    return;
  }

  // 3. TEST 1 & 5: Superadmin Creates Admin
  console.log('\n--- TEST 1 & 5: Superadmin Creates Admin ---');
  let newAdminId = '';
  try {
    const createRes = await fetch(`${BASE_URL}/api/superadmin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': superadminCookie,
      },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const createData = await createRes.json();
    console.log(`Create Admin Status: ${createRes.status}`);
    console.log(`Create Admin Response:`, createData);

    if (createRes.status === 201 && createData.user && createData.user.role === 'admin') {
      console.log('✅ TEST 1 PASSED: Admin created with role=admin.');
      newAdminId = createData.user.id;
    } else {
      console.error('❌ TEST 1 FAILED:', createData.error);
    }
  } catch (err) {
    console.error('TEST 1 Error:', err.message);
  }

  // Verify Superadmin Session Remains Unchanged (TEST 5)
  console.log('\n--- TEST 5: Verify Superadmin Session Unchanged ---');
  try {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Cookie': superadminCookie },
    });
    const meData = await meRes.json();
    console.log(`Session Role After Creation: ${meData?.user?.role}`);
    if (meData?.user?.role?.toLowerCase() === 'superadmin') {
      console.log('✅ TEST 5 PASSED: Superadmin session remained superadmin.');
    } else {
      console.error('❌ TEST 5 FAILED: Superadmin session was altered!');
    }
  } catch (err) {
    console.error('TEST 5 Error:', err.message);
  }

  // 4. TEST 6: New Admin Logs In Independently
  console.log('\n--- TEST 6: New Admin Login ---');
  let newAdminCookie = '';
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const adminData = await adminLoginRes.json();
    const setCookie = adminLoginRes.headers.get('set-cookie');
    if (setCookie) newAdminCookie = setCookie.split(';')[0];

    console.log(`New Admin Login Status: ${adminLoginRes.status}`);
    console.log(`New Admin Role: ${adminData?.user?.role}`);
    if (adminLoginRes.status === 200 && adminData?.user?.role === 'admin') {
      console.log('✅ TEST 6 PASSED: New admin logged in successfully with role=admin.');
    } else {
      console.error('❌ TEST 6 FAILED:', adminData.error);
    }
  } catch (err) {
    console.error('TEST 6 Error:', err.message);
  }

  // 5. TEST 2 & 7 & 8: New Admin Attempts Privileged Operations
  console.log('\n--- TEST 2, 7 & 8: Admin Privileged Access Restrictions ---');
  if (newAdminCookie) {
    // TEST 2: Admin tries to create another admin
    try {
      const forbiddenRes = await fetch(`${BASE_URL}/api/superadmin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': newAdminCookie,
        },
        body: JSON.stringify({ name: 'Hacker Admin', email: 'hacker@admin.com', password: 'Password123!' }),
      });
      console.log(`Admin Creating Admin Status: ${forbiddenRes.status} (Expected 403)`);
      if (forbiddenRes.status === 403) {
        console.log('✅ TEST 2 PASSED: Admin blocked from creating another admin.');
      } else {
        console.error(`❌ TEST 2 FAILED: Unexpected status ${forbiddenRes.status}`);
      }
    } catch (err) {
      console.error('TEST 2 Error:', err.message);
    }

    // TEST 7 & 8: Admin tries to fetch superadmin users
    try {
      const usersRes = await fetch(`${BASE_URL}/api/superadmin/users`, {
        headers: { 'Cookie': newAdminCookie },
      });
      console.log(`Admin Accessing Superadmin Users Status: ${usersRes.status} (Expected 403)`);
      if (usersRes.status === 403) {
        console.log('✅ TEST 7 & 8 PASSED: Admin blocked from superadmin users management.');
      } else {
        console.error(`❌ TEST 7 & 8 FAILED: Unexpected status ${usersRes.status}`);
      }
    } catch (err) {
      console.error('TEST 7/8 Error:', err.message);
    }
  }

  // Cleanup test user from Database
  if (newAdminId) {
    console.log('\n--- CLEANING UP TEST USER ---');
    try {
      const delRes = await fetch(`${BASE_URL}/api/superadmin/users/${newAdminId}`, {
        method: 'DELETE',
        headers: { 'Cookie': superadminCookie },
      });
      console.log(`Cleanup status: ${delRes.status}`);
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  }

  console.log('\n=== TEST SUITE COMPLETE ===');
}

runTests().catch(err => console.error('Fatal test error:', err));
