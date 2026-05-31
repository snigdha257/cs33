const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    r.end();
  });
}

async function run() {
  const raw = await get('/api/faqs/6a1ae4b97a79f0719d086c57');
  console.log('raw keys:', Object.keys(raw));
  console.log('raw.success:', raw.success);
  console.log('raw.data._id:', raw.data?._id);
  console.log('raw.data.question:', raw.data?.question?.slice(0, 40));

  // If axios wraps it:
  // axiosResponse.data = raw = { success: true, data: faqObject }
  // So res.data = { success: true, data: faqObject }
  // Then setFaq(res.data) sets faq = { success: true, data: faqObject }
  // faq._id = undefined  <-- THIS IS THE BUG!
  // setFaq(res.data.data) = faqObject  <-- CORRECT!
}

run().catch(console.error);