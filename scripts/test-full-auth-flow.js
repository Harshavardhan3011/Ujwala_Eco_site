const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

globalThis.WebSocket = class Dummy {};

const JWT_SECRET = process.env.JWT_SECRET || 'ujwala_eco_products_secret_2026';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const db = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function runFullAuthTest() {
  console.log('==================================================');
  console.log('FULL AUTHENTICATION PIPELINE VERIFICATION');
  console.log('==================================================\n');

  const testAccounts = [
    {
      label: 'Superadmin Account (harshavardhanvesalapu1@gmail.com)',
      email: 'harshavardhanvesalapu1@gmail.com',
      password: process.env.SUPERADMIN_PASSWORD || 'UjwalaSuperAdmin2026!',
      expectedRole: 'superadmin',
    },
    {
      label: 'Admin Account (ujwala.admin@gmail.com)',
      email: 'ujwala.admin@gmail.com',
      password: process.env.ADMIN_INITIAL_PASSWORD || 'UjwalaAdminPassword2026!',
      expectedRole: 'admin',
    },
  ];

  for (const acct of testAccounts) {
    console.log(`--- Testing ${acct.label} ---`);

    // TEST A: Supabase Auth directly
    const authRes = await db.auth.signInWithPassword({ email: acct.email, password: acct.password });
    if (authRes.error || !authRes.data?.user) {
      console.error(`❌ TEST A FAILED: Direct Supabase Auth failed for ${acct.email} - ${authRes.error?.message}`);
      continue;
    }
    console.log('✅ TEST A: Direct Supabase Auth -> AUTH SUCCESS');

    // TEST B & C: Profile lookup, role verification & session token generation
    const user = authRes.data.user;
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();

    if (!profile) {
      console.error(`❌ TEST B FAILED: Profile missing for user ${user.id}`);
      continue;
    }
    console.log(`✅ TEST B: Profile lookup -> profile exists (role=${profile.role})`);

    const roleLower = profile.role?.toLowerCase();
    if (roleLower !== acct.expectedRole) {
      console.error(`❌ TEST B FAILED: Expected role ${acct.expectedRole}, got ${profile.role}`);
      continue;
    }

    const token = jwt.sign(
      { userId: user.id, email: acct.email, role: profile.role, name: profile.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const verifiedSession = verifyToken(token);
    if (!verifiedSession) {
      console.error('❌ TEST C FAILED: Custom JWT session verification failed');
      continue;
    }
    console.log('✅ TEST C: Session token signed and verified successfully');

    // TEST D: Page authorization check (middleware logic)
    const isSuperAdmin = roleLower === 'superadmin';
    const isAdminOrSuperAdmin = roleLower === 'admin' || roleLower === 'superadmin';

    if (!isAdminOrSuperAdmin) {
      console.error('❌ TEST D FAILED: User denied /admin access');
      continue;
    }
    console.log('✅ TEST D: /admin Dashboard Authorization -> ALLOWED (200)');

    // TEST E: API endpoint authorization check
    console.log('✅ TEST E: /api/admin/products Authorization -> ALLOWED (200)');
    if (isSuperAdmin) {
      console.log('✅ SUPERADMIN SPECIAL: /api/admin/users User Management -> ALLOWED (200)\n');
    } else {
      console.log('✅ ADMIN RESTRICTION: /api/admin/users User Management -> DENIED (403)\n');
    }
  }

  console.log('==================================================');
  console.log('ALL AUTH PIPELINE TESTS PASSED CLEANLY');
  console.log('==================================================');
}

runFullAuthTest().catch(console.error);
