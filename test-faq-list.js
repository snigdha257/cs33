const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  const login = await req('POST', '/api/auth/login', null, { email: 'user1@test.com', password: 'password123' });
  const token = login.token;

  // Check with auth
  const r = await req('GET', '/api/faqs?limit=5&page=1', token);
  console.log('Total:', r.pagination?.totalItems);
  const first = r.data?.[0];
  console.log('First FAQ _id:', first?._id, '| slug:', first?.slug, '| question:', first?.question?.slice(0,40));

  // Check without auth
  const r2 = await req('GET', '/api/faqs?limit=5&page=1', null);
  const first2 = r2.data?.[0];
  console.log('Without auth _id:', first2?._id, '| slug:', first2?.slug, '| question:', first2?.question?.slice(0,40));
}

run().catch(console.error);