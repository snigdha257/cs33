const User = require('../models/User');

const badgeThresholds = [
  { threshold: 10,   name: 'Newcomer' },
  { threshold: 50,   name: 'Contributor' },
  { threshold: 200,  name: 'Trusted' },
  { threshold: 500,  name: 'Expert' },
  { threshold: 1000, name: 'Legend' },
];

const awardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const reputation = user.reputation || 0;
  const existingNames = (user.badges || []).map((b) => b.name);

  const newBadges = badgeThresholds
    .filter((b) => reputation >= b.threshold && !existingNames.includes(b.name))
    .map((b) => ({ name: b.name, awardedAt: new Date() }));

  if (newBadges.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { badges: { $each: newBadges } },
    });
  }
};

module.exports = awardBadges;