const http = require('http');

function req(method, path, body, headers) {
  return new Promise(r => {
    const opts = { hostname: 'localhost', port: 5000, path, method, headers };
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { r({ s: res.statusCode, b: JSON.parse(d) }); }
        catch (e) { r({ s: res.statusCode, b: d.slice(0, 100) }); }
      });
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const login = await req('POST', '/api/auth/login', { email: 'user1@test.com', password: 'password123' }, { 'Content-Type': 'application/json' });
  const token = login.b?.token;
  console.log('login:', login.s, token ? 'token ok' : 'no token - ' + login.b?.message);
  if (!token) return;

  const before = await req('GET', '/api/notifications', null, { Authorization: 'Bearer ' + token });
  console.log('before unread:', before.b?.unreadCount, '| count:', before.b?.data?.length);

  const mark = await req('PATCH', '/api/notifications/read/all', null, { Authorization: 'Bearer ' + token });
  console.log('markAllRead:', mark.s, mark.b?.message);

  const after = await req('GET', '/api/notifications', null, { Authorization: 'Bearer ' + token });
  console.log('after unread:', after.b?.unreadCount);
}

run().catch(console.error);