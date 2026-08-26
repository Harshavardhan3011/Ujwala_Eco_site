/**
 * UJWALA ECO PRODUCTS — SUPERADMIN & ROLE HIERARCHY SECURITY AUDIT
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

function isSuperAdmin(role) {
  return role?.toLowerCase() === 'superadmin';
}

function isAdminOrSuperAdmin(role) {
  const r = role?.toLowerCase();
  return r === 'admin' || r === 'superadmin';
}

function verifyAdminFromRequest(req) {
  const token = req.cookies?.get?.('auth_token')?.value || req.headers?.get?.('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const session = verifyToken(token);
  if (!session || !isAdminOrSuperAdmin(session.role)) {
    return null;
  }
  return session;
}

function verifySuperAdminFromRequest(req) {
  const token = req.cookies?.get?.('auth_token')?.value || req.headers?.get?.('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const session = verifyToken(token);
  if (!session || !isSuperAdmin(session.role)) {
    return null;
  }
  return session;
}

async function runHierarchyAudit() {
  console.log('=== STARTING ROLE HIERARCHY SECURITY AUDIT ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
    }
  }

  // 1. Anonymous User
  const anonReq = { cookies: { get: () => null }, headers: { get: () => null } };
  assert(verifyAdminFromRequest(anonReq) === null, 'Anonymous denied operational admin API');
  assert(verifySuperAdminFromRequest(anonReq) === null, 'Anonymous denied user management API');

  // 2. Customer User
  const customerToken = signToken({ userId: '1', email: 'cust@test.com', role: 'customer', name: 'Cust' });
  const custReq = { cookies: { get: (name) => (name === 'auth_token' ? { value: customerToken } : null) } };
  assert(verifyAdminFromRequest(custReq) === null, 'Customer denied operational admin API');
  assert(verifySuperAdminFromRequest(custReq) === null, 'Customer denied user management API');

  // 3. Admin User
  const adminToken = signToken({ userId: '2', email: 'admin@test.com', role: 'admin', name: 'Admin' });
  const adminReq = { cookies: { get: (name) => (name === 'auth_token' ? { value: adminToken } : null) } };
  assert(verifyAdminFromRequest(adminReq) !== null, 'Admin allowed operational admin API');
  assert(verifySuperAdminFromRequest(adminReq) === null, 'Admin denied user management API');

  // 4. Superadmin User
  const superToken = signToken({ userId: '3', email: 'harshavardhanvesalapu1@gmail.com', role: 'superadmin', name: 'Superadmin' });
  const superReq = { cookies: { get: (name) => (name === 'auth_token' ? { value: superToken } : null) } };
  assert(verifyAdminFromRequest(superReq) !== null, 'Superadmin allowed operational admin API');
  assert(verifySuperAdminFromRequest(superReq) !== null, 'Superadmin allowed user management API');

  console.log(`\n=== AUDIT COMPLETE: ${passed}/${total} checks passed ===\n`);
}

runHierarchyAudit().catch(console.error);
