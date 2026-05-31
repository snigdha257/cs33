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
  // Simulate what axios would do - the raw HTTP response body is JSON
  const raw = await get('/api/faqs/6a1ae4b97a79f0719d086c57');
  console.log('Full response keys:', Object.keys(raw));
  console.log('raw.success:', raw.success);
  console.log('raw.data._id:', raw.data?._id);
  console.log('raw.data.question:', raw.data?.question?.slice(0, 40));
  console.log('raw.data.data:', raw.data?.data); // should be undefined
}

run().catch(console.error);