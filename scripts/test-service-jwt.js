const { SignJWT } = require('jose');
require('dotenv').config({ path: '.env.local' });

async function testServiceRoleFetch() {
  const jwtSecret = process.env.JWT_SECRET || 'ujwala_eco_products_super_secret_jwt_key_2026_prod';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  console.log('Generating service_role token...');
  const secret = new TextEncoder().encode(jwtSecret);
  const serviceRoleToken = await new SignJWT({
    role: 'service_role',
    iss: 'supabase',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('10y')
    .sign(secret);

  console.log('Service Role Token generated. Making PostgREST HTTPS request...');

  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?role=in.(admin,superadmin)&select=id,name,email,role`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${serviceRoleToken}`,
    },
  });

  const data = await response.json();
  console.log('HTTPS STATUS:', response.status);
  console.log('DATA:', data);
}

testServiceRoleFetch().catch(console.error);
