const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cs33');

  const adminMods = await User.find({ role: { $in: ['admin', 'moderator'] } }).select('name email role reputation badges');
  console.log('Admin/Mod users:');
  adminMods.forEach(u => console.log(' ', u.name, '|', u.role, '| rep:', u.reputation, '| badges:', JSON.stringify(u.badges.map(b => b.name))));

  const lb = await User.find().sort({ reputation: -1 }).limit(10).select('name role reputation');
  console.log('\nTop 10 by reputation:');
  lb.forEach((u, i) => console.log(i+1 + '.', u.name, '|', u.role, '| rep:', u.reputation));

  await mongoose.disconnect();
}
check().catch(e => { console.error(e.message); process.exit(1); });