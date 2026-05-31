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
  const r = await get('/api/faqs?limit=5');
  const data = r.data || [];
  data.forEach((faq, i) => {
    console.log(`[${i}] _id=${faq._id} id=${faq.id} slug=${faq.slug} question=${faq.question?.slice(0,40)}`);
  });
}

run().catch(console.error);