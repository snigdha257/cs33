const http = require('http');

function fetch(path) {
  return new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET' }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const parsed = JSON.parse(d);
        console.log('Raw response structure:');
        console.log('  success:', parsed.success);
        console.log('  data === FAQ object?:', typeof parsed.data === 'object' && !!parsed.data._id);
        console.log('  data._id:', parsed.data?._id);
        console.log('  data.data:', parsed.data?.data);
        console.log('');
        // The FAQDetailPage does: setFaq(res.data.data)
        // That means: parsed.data.data === undefined (wrong if data is the FAQ)
        // But res.data.data should be the FAQ if the wrapper is { success, data: { ... } }
        // Let me check what the axios result looks like
        // axios puts the parsed JSON in res.data
        // So res.data = { success: true, data: { FAQ } }
        // Thus res.data.data = { FAQ }
        // But our test shows res.data.data is undefined, meaning data IS the FAQ already
        // That would mean the server returns: { success: true, data: { FAQ } }
        // And axios res.data = that object
        // So res.data.data = the FAQ? But our test says undefined
        console.log('CONFUSION CHECK:');
        console.log('  parsed.data is the FAQ object directly');
        console.log('  parsed.data === { _id: ..., question: ... }? ', parsed.data?._id === '6a1ae4b97a79f0719d086c57');
      });
    });
    r.end();
  });
}

async function run() {
  await fetch('/api/faqs/6a1ae4b97a79f0719d086c57');
}

run();