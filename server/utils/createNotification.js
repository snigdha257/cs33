const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({ recipient, sender, type, faqId, message, io, userPrefs = null }) => {
  if (!recipient) return;
  if (sender && recipient.equals(sender)) return;

  // Use provided prefs if passed, otherwise fetch once (lean)
  const user = userPrefs ?? await User.findById(recipient).select('notifyOnAnswer notifyOnComment').lean();
  if (!user) return;

  if (type === 'answer' && !user.notifyOnAnswer) return;
  if (type === 'comment' && !user.notifyOnComment) return;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    faqId,
    message,
  });

  if (io) {
    io.to(`user:${recipient.toString()}`).emit('notification:new', { notification });
  }
};

module.exports = createNotification;