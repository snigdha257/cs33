const mongoose = require('./server/node_modules/mongoose');
const User = require('./server/models/User');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/faq_portal');
  
  // Check all users and their IDs
  const users = await User.find({}).select('email name _id role savedFAQs');
  console.log('Total users:', users.length);
  users.forEach(u => console.log(' - ID:', u._id.toString(), '| email:', u.email, '| name:', u.name, '| savedFAQs:', u.savedFAQs?.length || 0));
  
  // Check if admin ID from token exists
  const adminId = '6a1975899a7ff82bcdcaa497';
  const admin = await User.findById(adminId);
  console.log('Admin ID', adminId, 'exists:', !!admin, admin?.name);
  
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error('Error:', err.message); process.exit(1); });