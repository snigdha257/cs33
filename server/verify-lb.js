const http = require('http');
function req(method, path, body, token) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const r = http.request({ hostname: 'localhost', port: 5000, path: '/api' + path, method, headers }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    r.on('error', e => resolve({ error: e.message }));
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}
(async () => {
  const login = await req('POST', '/auth/login', { email: 'admin@test.com', password: 'password123' });
  const token = login.token;
  const lb = await req('GET', '/users/leaderboard', null, token);
  const data = lb.data || lb;
  data.slice(0, 5).forEach((u, i) => {
    console.log(i+1 + '.', u.name, '| role:', u.role, '| rep:', u.reputation);
  });
})().catch(e => console.error(e.message));