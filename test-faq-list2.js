const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.end();
  });
}

async function run() {
  const r = await get('/api/faqs?limit=3');
  console.log('totalItems:', r.pagination?.totalItems);
  console.log('data length:', r.data?.length);
  console.log('first item keys:', Object.keys(r.data?.[0] || {}).join(', '));
  console.log('first._id:', r.data?.[0]?._id);
  console.log('first id:', r.data?.[0]?.id);
  console.log('first question:', r.data?.[0]?.question?.slice(0, 40));
  console.log('first item:', JSON.stringify(r.data?.[0] || {}).slice(0, 200));
}

run().catch(console.error);