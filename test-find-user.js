const mongoose = require('./server/node_modules/mongoose');
const User = require('./server/models/User');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/faq-portal');
  const users = await User.find({}).select('email name savedFAQs role').limit(10);
  users.forEach(u => console.log(' -', u.email, '|', u.name, '| savedFAQs:', u.savedFAQs?.length || 0, '| role:', u.role));
  await mongoose.disconnect();
  process.exit(0);
})();