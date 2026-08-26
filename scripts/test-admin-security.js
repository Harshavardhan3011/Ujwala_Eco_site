/**
 * UJWALA ECO PRODUCTS — ADMIN SECURITY AUDIT & VERIFICATION SCRIPT
 */

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET || 'ujwala_eco_products_secret_2026';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyAdminFromRequest(req) {
  const token = req.cookies?.get?.('auth_token')?.value || req.headers?.get?.('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const session = verifyToken(token);
  if (!session || !session.role || session.role.toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

async function runSecurityTests() {
  console.log('=== STARTING ADMIN SECURITY SUITE ===\n');

  let passedCount = 0;

  // TEST 1: Unauthenticated Token Verification
  console.log('TEST 1: Unauthenticated token check...');
  const nullSession = verifyToken('');
  if (nullSession === null) {
    console.log('  ✅ PASSED: Empty/null token returns null session.');
    passedCount++;
  } else {
    console.error('  ❌ FAILED: Null token returned session!');
  }

  // TEST 2: Customer Token Admin Verification
  console.log('\nTEST 2: Customer role admin check...');
  const customerToken = signToken({
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'customer@example.com',
    role: 'customer',
    name: 'Test Customer',
  });

  const mockReqCustomer = {
    cookies: { get: (name) => (name === 'auth_token' ? { value: customerToken } : null) },
    headers: { get: () => null },
  };

  const customerAdminCheck = verifyAdminFromRequest(mockReqCustomer);
  if (customerAdminCheck === null) {
    console.log('  ✅ PASSED: Customer token denied admin access.');
    passedCount++;
  } else {
    console.error('  ❌ FAILED: Customer token was granted admin access!');
  }

  // TEST 3: Admin Token Admin Verification
  console.log('\nTEST 3: Admin role verification...');
  const adminToken = signToken({
    userId: '22222222-2222-2222-2222-222222222222',
    email: 'admin@ujwalaeco.com',
    role: 'admin',
    name: 'System Admin',
  });

  const mockReqAdmin = {
    cookies: { get: (name) => (name === 'auth_token' ? { value: adminToken } : null) },
    headers: { get: () => null },
  };

  const adminCheck = verifyAdminFromRequest(mockReqAdmin);
  if (adminCheck && adminCheck.role === 'admin') {
    console.log('  ✅ PASSED: Admin token verified successfully.');
    passedCount++;
  } else {
    console.error('  ❌ FAILED: Valid admin token failed verification!');
  }

  // TEST 4: Tampered Role Token Check
  console.log('\nTEST 4: Tampered token signature check...');
  const tamperedToken = customerToken + 'tampered';
  const mockReqTampered = {
    cookies: { get: (name) => (name === 'auth_token' ? { value: tamperedToken } : null) },
    headers: { get: () => null },
  };

  const tamperedCheck = verifyAdminFromRequest(mockReqTampered);
  if (tamperedCheck === null) {
    console.log('  ✅ PASSED: Tampered token rejected by JWT signature check.');
    passedCount++;
  } else {
    console.error('  ❌ FAILED: Tampered token was accepted!');
  }

  console.log(`\n=== VERIFICATION COMPLETE: ${passedCount}/4 tests passed ===\n`);
}

runSecurityTests().catch(console.error);
