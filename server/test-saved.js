require('dotenv').config();
const http = require('http');

const makeReq = (opts, body) => new Promise((resolve) => {
  const h = { 'Content-Type': 'application/json' };
  if (body) {
    const b = JSON.stringify(body);
    h['Content-Length'] = Buffer.byteLength(b);
    const req = http.request({ ...opts, headers: h }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.write(b); req.end();
  } else {
    const req = http.request({ ...opts, headers: h }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.end();
  }
});

(async () => {
  // Step 1: Login
  const login = await makeReq(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
    { email: 'user1@test.com', password: 'password123' }
  );
  console.log('Login:', login.status, login.body.success, 'token len:', login.body.token?.length);
  const token = login.body.token;

  // Step 2: Get saved FAQs with Bearer token
  const saved = await makeReq(
    { hostname: 'localhost', port: 5000, path: '/api/users/saved', method: 'GET', headers: { Authorization: 'Bearer ' + token } },
    null
  );
  console.log('GET /api/users/saved =>', saved.status, JSON.stringify(saved.body));

  await new Promise(r => setTimeout(r, 500));
})().catch(e => console.error('ERROR:', e.message));