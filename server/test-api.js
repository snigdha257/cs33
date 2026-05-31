const http = require('http');
const go = (path, method, headers, body) => new Promise((resolve) => {
  const req = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, b: d })); });
  req.on('error', e => resolve({ s: 0, b: e.message })); if (body) req.write(body); req.end();
});
(async () => {
  const lb = JSON.stringify({ email: 'user1@test.com', password: 'password123' });
  const login = await go('/api/auth/login', 'POST', { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(lb) }, lb);
  const { token } = JSON.parse(login.b);
  const saved = await go('/api/users/saved', 'GET', { 'Authorization': `Bearer ${token}` });
  console.log(saved.s, saved.b.slice(0, 80));
  process.exit(0);
})();