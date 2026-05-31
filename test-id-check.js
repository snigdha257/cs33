const http = require('http');
const https = require('https');

// Test the EXACT id from the browser debug
const targetId = '6a1c19e0c15c5535b0fce1c7';

// First get a token
function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: 'localhost', port: 5000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.write(data); req.end();
  });
}

function get(path, token) {
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET', headers }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.end();
  });
}

async function run() {
  // Login as lohit
  const login = await post('/api/auth/login', { email: 'lohit@gmail.com', password: 'password123' });
  const token = login.body?.token;
  console.log('Token:', token ? 'got token' : 'NO TOKEN');

  // Now request the FAQ with auth
  console.log('\n--- WITH AUTH ---');
  const r1 = await get(`/api/faqs/${targetId}`, token);
  console.log('Status:', r1.status);
  console.log('Returned _id:', r1.body?.data?._id);
  console.log('Question:', r1.body?.data?.question?.slice(0, 50));

  // Without auth
  console.log('\n--- WITHOUT AUTH ---');
  const r2 = await get(`/api/faqs/${targetId}`);
  console.log('Status:', r2.status);
  console.log('Returned _id:', r2.body?.data?._id);
  console.log('Question:', r2.body?.data?.question?.slice(0, 50));

  // Check via slug
  console.log('\n--- CHECKING SLUG MATCH ---');
  const list = await get('/api/faqs?limit=30');
  const faq = list.body?.data?.find(f => f._id === targetId);
  console.log('Found in getAll:', faq ? `YES - ${faq.question?.slice(0,40)}` : 'NO');
  console.log('Found slug:', faq?.slug);

  // Now request by slug instead
  if (faq?.slug) {
    const r3 = await get(`/api/faqs/${faq.slug}`, token);
    console.log('\n--- BY SLUG ---');
    console.log('Status:', r3.status);
    console.log('Returned _id:', r3.body?.data?._id);
    console.log('Question:', r3.body?.data?.question?.slice(0, 50));
  }
}

run().catch(console.error);