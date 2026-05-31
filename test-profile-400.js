const http = require('http');

// Try to replicate exactly what the browser sends
function req(method, path, body, extraHeaders) {
  return new Promise(r => {
    const headers = {
      'Accept': 'application/json',
      ...extraHeaders
    };
    const opts = { hostname: 'localhost', port: 5000, path, method, headers };
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { r({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { r({ status: res.statusCode, body: d.slice(0, 300) }); }
      });
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  // Login and get a real token
  const login = await req('POST', '/api/auth/login', { email: 'lohith@gmail.com', password: 'password123' }, { 'Content-Type': 'application/json' });
  const token = login.body?.token;
  console.log('Token:', token ? 'got ' + token.slice(0, 20) + '...' : 'NONE');
  if (!token) { console.log('Login failed:', login.body); return; }

  const uid = '6a1aafe17591e2d525880402';

  // Test with Authorization header (like browser would)
  const r1 = await req('GET', `/api/users/${uid}/activity`, null, { Authorization: 'Bearer ' + token });
  console.log('activity (with auth):', r1.status, r1.body?.message || '');

  const r2 = await req('GET', `/api/users/${uid}/answers`, null, { Authorization: 'Bearer ' + token });
  console.log('answers (with auth):', r2.status, r2.body?.message || '');

  // Without auth
  const r3 = await req('GET', `/api/users/${uid}/activity`, null, {});
  console.log('activity (no auth):', r3.status);

  // Test with cookie-style header
  const r4 = await req('GET', `/api/users/${uid}/activity`, null, { Cookie: `token=${token}` });
  console.log('activity (cookie):', r4.status);

  // Also test the actual faqs endpoint to see if that works
  const r5 = await req('GET', '/api/faqs', null, { Authorization: 'Bearer ' + token });
  console.log('faqs (with auth):', r5.status, '| count:', r5.body?.data?.length);
}
run().catch(console.error);