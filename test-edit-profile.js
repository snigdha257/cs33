const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch { resolve(d); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  // Login
  const login = await req('POST', '/api/auth/login', null, { email: 'user1@test.com', password: 'password123' });
  const token = login.token;
  const uid = login.user.id;
  console.log('✅ Login OK:', uid);

  // 1. Update profile with empty avatar
  const r1 = await req('PUT', `/api/users/${uid}/profile`, token, { name: 'AliceUpdated', bio: 'Bio test', avatar: '', notifyOnAnswer: true, notifyOnComment: false });
  if (r1.success) {
    console.log('✅ Profile update (empty avatar):', r1.data?.name);
  } else {
    console.log('❌ Profile update FAILED:', JSON.stringify(r1));
  }

  // 2. Update profile with URL avatar
  const r2 = await req('PUT', `/api/users/${uid}/profile`, token, { name: 'AliceUpdated2', bio: 'Bio 2', avatar: 'https://example.com/avatar.png', notifyOnAnswer: true, notifyOnComment: false });
  if (r2.success) {
    console.log('✅ Profile update (URL avatar):', r2.data?.name);
  } else {
    console.log('❌ Profile update (URL avatar) FAILED:', JSON.stringify(r1));
  }

  // 3. Change password with wrong current
  const r3 = await req('PUT', `/api/users/${uid}/password`, token, { currentPassword: 'wrongpassword', newPassword: 'newpass123' });
  if (!r3.success && r3.message.includes('incorrect')) {
    console.log('✅ Change password (wrong current): correctly rejected');
  } else {
    console.log('❌ Change password (wrong current) result:', JSON.stringify(r3));
  }

  // 4. Change password with correct current
  const r4 = await req('PUT', `/api/users/${uid}/password`, token, { currentPassword: 'password123', newPassword: 'password123' });
  if (r4.success) {
    console.log('✅ Change password (correct current): OK');
  } else {
    console.log('❌ Change password FAILED:', JSON.stringify(r4));
  }

  // 5. Upload endpoint reachable
  const r5 = await req('POST', '/api/upload/image', token, {});
  console.log('✅ Upload endpoint responds:', r5.message || JSON.stringify(r5).substring(0, 80));

  console.log('\n=== ALL TESTS COMPLETE ===');
}

run().catch(e => console.error('Test error:', e.message));