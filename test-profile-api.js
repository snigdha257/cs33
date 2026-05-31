const http = require('http');

function req(method, path, body, headers = {}) {
  return new Promise(r => {
    const opts = { hostname: 'localhost', port: 5000, path, method, headers };
    const req = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { r({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { r({ status: res.statusCode, body: d }); }
      });
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  // Login
  const login = await req('POST', '/api/auth/login', { email: 'user1@test.com', password: 'password123' }, { 'Content-Type': 'application/json' });
  const token = login.body?.token;
  console.log('Token:', token ? 'yes' : 'no');
  if (!token) { console.log('Login failed:', login.body); return; }

  // Get my user id
  const me = await req('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + token });
  const uid = me.body?.data?._id;
  console.log('My uid:', uid);

  // getUserActivity
  const act = await req('GET', `/api/users/${uid}/activity`, null, { Authorization: 'Bearer ' + token });
  console.log('\n--- getUserActivity ---');
  console.log('Status:', act.status);
  console.log('Data length:', act.body?.data?.length);
  console.log('First item keys:', Object.keys(act.body?.data?.[0] || {}).join(', '));
  console.log('First item sample:', JSON.stringify(act.body?.data?.[0])?.slice(0, 400));

  // getUserAnswers
  const ans = await req('GET', `/api/users/${uid}/answers`, null, { Authorization: 'Bearer ' + token });
  console.log('\n--- getUserAnswers ---');
  console.log('Status:', ans.status);
  console.log('Data length:', ans.body?.data?.answers?.length);
  console.log('First answer keys:', Object.keys(ans.body?.data?.answers?.[0] || {}).join(', '));

  // getLeaderboard
  const lb = await req('GET', '/api/users/leaderboard', null, {});
  console.log('\n--- getLeaderboard ---');
  console.log('Status:', lb.status);
  console.log('First entry keys:', Object.keys(lb.body?.data?.[0] || {}).join(', '));
}

run().catch(console.error);