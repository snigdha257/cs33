const http = require('http');

// Simulate what axios actually does
function getViaAxios(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        // axios parses JSON body → puts in res.data
        // So res.data = parsed JSON = { success: true, data: faqObject }
        const axiosRes = { data: JSON.parse(d) };
        console.log(`\n=== GET ${path} ===`);
        console.log('axiosRes.data:', JSON.stringify(axiosRes.data).slice(0, 100));
        console.log('axiosRes.data._id:', axiosRes.data?._id);
        console.log('axiosRes.data.data._id:', axiosRes.data?.data?._id);
        console.log('axiosRes.data.data.question?.slice(0,30):', axiosRes.data?.data?.question?.slice(0, 30));

        // So if FAQDetailPage does: setFaq(axiosRes.data)
        // It sets faq = { success: true, data: { FAQ } }
        // faq._id = undefined ❌
        // But if it does: setFaq(axiosRes.data.data)
        // It sets faq = { FAQ } ✓
        console.log('\nsetFaq(axiosRes.data) → faq._id =', axiosRes.data?._id);
        console.log('setFaq(axiosRes.data.data) → faq._id =', axiosRes.data?.data?._id);

        resolve(axiosRes);
      });
    });
    r.end();
  });
}

async function run() {
  await getViaAxios('/api/faqs/6a1ae4b97a79f0719d086c57');
  await getViaAxios('/api/faqs?limit=1');
}

run().catch(console.error);