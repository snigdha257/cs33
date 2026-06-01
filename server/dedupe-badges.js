const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function dedupe() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cs33');

  // Find all users with badges
  const users = await User.find({ 'badges.0': { $exists: true } }).select('name badges');

  let totalCleaned = 0;
  for (const user of users) {
    // Keep only the FIRST occurrence of each unique badge name
    const seen = new Set();
    const unique = [];
    for (const badge of user.badges) {
      if (!seen.has(badge.name)) {
        seen.add(badge.name);
        unique.push(badge);
      }
    }

    if (unique.length < user.badges.length) {
      console.log(`${user.name}: had ${user.badges.length} badges → ${unique.length}: [${unique.map(b => b.name).join(', ')}]`);
      await User.updateOne({ _id: user._id }, { $set: { badges: unique } });
      totalCleaned++;
    }
  }

  console.log(`\nTotal users cleaned: ${totalCleaned}`);

  // Verify result
  const after = await User.find({ 'badges.1': { $exists: true } }).select('name badges');
  console.log('Users still with 2+ badges after fix:', after.length);

  await mongoose.disconnect();
}
dedupe().catch(e => { console.error(e.message); process.exit(1); });