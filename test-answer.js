const http = require('http');

function login(email, pass) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email, password: pass });
    const r = http.request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    r.write(body); r.end();
  });
}

function postAnswer(token, faqId, answerBody) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ body: answerBody });
    const r = http.request({ hostname: 'localhost', port: 5000, path: `/api/faqs/${faqId}/answers`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': body.length } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    r.write(body); r.end();
  });
}

async function run() {
  const loginData = await login('user1@test.com', 'password123');
  const token = loginData.token;
  const faqId = '6a1ae4b97a79f0719d086c57'; // first FAQ

  console.log('FAQ ID:', faqId);
  const res = await postAnswer(token, faqId, 'This is a test answer that is definitely longer than thirty characters.');
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.body));
}

run().catch(console.error);