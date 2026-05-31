const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers));
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        console.log('Raw response:', d.slice(0, 300));
        try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); }
      });
    });
    r.end();
  });
}

async function run() {
  await get('/api/faqs?limit=3');
}

run().catch(console.error);