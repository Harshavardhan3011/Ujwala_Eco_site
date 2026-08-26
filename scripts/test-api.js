const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    }).on('error', reject);
  });
}

async function testAll() {
  console.log('Testing APIs locally on http://localhost:3000 ...\n');

  const tests = [
    '/api/products',
    '/api/products?featured=true&limit=8',
    '/api/products?sort=featured&minPrice=0&maxPrice=5000&page=1&limit=12',
    '/api/categories',
  ];

  for (const path of tests) {
    try {
      const res = await makeRequest(path);
      console.log(`GET ${path}`);
      console.log(`Status: ${res.status}`);
      if (res.data?.products) {
        console.log(`Products returned: ${res.data.products.length} (Total in DB: ${res.data.pagination?.total})`);
        if (res.data.products.length > 0) {
          console.log(`  Sample 1: "${res.data.products[0].name}" (Price: ₹${res.data.products[0].price})`);
          console.log(`  Sample 1 Image: ${res.data.products[0].images?.[0]?.imageUrl || 'No image'}`);
        }
      } else if (res.data?.categories) {
        console.log(`Categories returned: ${res.data.categories.length}`);
      }
      console.log('--------------------------------------------------\n');
    } catch (e) {
      console.error(`Error requesting ${path}:`, e.message);
    }
  }
}

setTimeout(testAll, 3000);
