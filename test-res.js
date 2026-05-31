const http = require('http');

// Test both endpoints with detailed logging
function test(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const parsed = JSON.parse(d);
        console.log(`\n=== GET ${path} ===`);
        console.log('Parsed keys:', Object.keys(parsed));
        console.log('parsed.success:', parsed.success);
        console.log('parsed.data?._id:', parsed.data?._id);
        console.log('parsed.data?.question?.slice(0,30):', parsed.data?.question?.slice(0, 30));
        console.log('parsed.data?.data?._id:', parsed.data?.data?._id);
        console.log('parsed.data === FAQ object?', parsed.data?._id ? 'YES (data IS FAQ)' : 'NO (data is wrapper)');
        resolve(parsed);
      });
    });
    r.end();
  });
}

async function run() {
  await test('/api/faqs?limit=1');
  await test('/api/faqs/6a1ae4b97a79f0719d086c57');
}

run().catch(console.error);