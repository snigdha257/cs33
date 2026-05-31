const http = require('http');

// Simulate what axios does
function fetch(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        // axios parses JSON and puts it in res.data
        const resData = JSON.parse(d);
        console.log('=== API raw response ===');
        console.log('Full:', JSON.stringify(resData).slice(0, 200));
        console.log('res.data._id:', resData.data?._id);
        console.log('res.data.question:', resData.data?.question?.slice(0, 40));
        console.log('res.data.data._id:', resData.data?.data?._id);
        // Simulate FAQDetailPage: setFaq(res.data.data)
        const faq = resData.data?.data;
        console.log('FAQ from res.data.data:', faq?._id, faq?.question?.slice(0, 40));
        // What if it should be res.data?
        const faq2 = resData.data;
        console.log('FAQ from res.data:', faq2?._id, faq2?.question?.slice(0, 40));
      });
    });
    r.end();
  });
}

async function run() {
  await fetch('/api/faqs/6a1ae4b97a79f0719d086c57');
  console.log('\n=== FAQList (getAll) ===');
  const r2 = http.request({ hostname: 'localhost', port: 5000, path: '/api/faqs?limit=2', method: 'GET' }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => {
      const resData = JSON.parse(d);
      console.log('getAll res.data.length:', resData.data?.length);
      console.log('first FAQ _id:', resData.data?.[0]?._id);
    });
  });
  r2.end();
}

run();