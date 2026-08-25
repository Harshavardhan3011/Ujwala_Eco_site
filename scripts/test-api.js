async function testAllRoutes() {
  const routes = [
    { url: '/api/categories', method: 'GET' },
    { url: '/api/products', method: 'GET' },
    { url: '/api/products?featured=true&limit=8', method: 'GET' },
    { url: '/api/products?sort=featured&minPrice=0&maxPrice=2000&page=1&limit=12', method: 'GET' },
    { url: '/api/cart', method: 'GET' },
    { url: '/api/wishlist', method: 'GET' },
    { url: '/api/reviews', method: 'GET' },
    { url: '/api/site-settings', method: 'GET' },
    { url: '/api/auth/me', method: 'GET' }
  ];

  console.log('=== FULL API BACKEND VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await fetch('http://localhost:3000' + r.url, { method: r.method });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }

      if (res.status >= 200 && res.status < 400) {
        console.log(`✓ [${res.status}] ${r.url}`);
        passed++;
      } else if (res.status === 401 && r.url === '/api/auth/me') {
        console.log(`✓ [${res.status} Expected 401 Unauthenticated] ${r.url}`);
        passed++;
      } else {
        console.log(`❌ [${res.status}] ${r.url} -> ${JSON.stringify(data)}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ [FETCH ERROR] ${r.url}:`, err.message);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} PASSED, ${failed} FAILED.`);
}

testAllRoutes();
