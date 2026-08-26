const http = require('http');

function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function runTests() {
  console.log('Testing API Endpoints against local server...');
  const endpoints = [
    '/api/categories',
    '/api/products?featured=true&limit=8',
    '/api/products?sort=featured&minPrice=0&maxPrice=2000&page=1&limit=12',
    '/api/cart',
    '/api/reviews',
    '/api/site-settings'
  ];

  let passed = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetchUrl(ep);
      if (res.status === 200) {
        console.log(`✅ [200 OK] ${ep}`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${ep}`, res.data || res.raw);
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${ep}: ${err.message}`);
    }
  }

  console.log(`\nResults: ${passed}/${endpoints.length} endpoints passed.`);
}

runTests();
