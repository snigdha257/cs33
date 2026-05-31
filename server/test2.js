const http = require('http');
const server = http.createServer((req, res) => {
  console.log('[TEST SERVER] method:', req.method);
  console.log('[TEST SERVER] path:', req.path);
  console.log('[TEST SERVER] headers:', JSON.stringify(req.headers));
  res.end('ok');
});
server.listen(5002, '127.0.0.1', () => console.log('Listening on 127.0.0.1:5002'));
setTimeout(() => { server.close(); process.exit(0); }, 5000);