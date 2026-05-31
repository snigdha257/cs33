const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  const login = await req('POST', '/api/auth/login', null, { email: 'user1@test.com', password: 'password123' });
  const token = login.token;
  const uid = login.user.id;

  // Test with minimal body to isolate the problem
  const r1 = await req('PUT', `/api/users/${uid}/profile`, token, { name: 'TestName' });
  console.log('Minimal body result:', JSON.stringify(r1));

  // Test with notify fields
  const r2 = await req('PUT', `/api/users/${uid}/profile`, token, { name: 'TestName', notifyOnAnswer: true, notifyOnComment: false });
  console.log('With bools result:', JSON.stringify(r2));

  // Test with empty avatar and bools
  const r3 = await req('PUT', `/api/users/${uid}/profile`, token, { name: 'TestName', avatar: '', notifyOnAnswer: true, notifyOnComment: false });
  console.log('With empty avatar result:', JSON.stringify(r3));

  // Test avatar = null
  const r4 = await req('PUT', `/api/users/${uid}/profile`, token, { name: 'TestName', avatar: null, notifyOnAnswer: true, notifyOnComment: false });
  console.log('With null avatar result:', JSON.stringify(r4));
}

run().catch(e => console.error('Test error:', e.message));