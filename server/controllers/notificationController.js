const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name avatar')
        .populate('faqId', 'question')
        .lean(),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    return next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id, isRead: false },
      { isRead: true },
      { new: true }
    );
    if (!notification) return next(new AppError('Notification not found or already read', 404));
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return next(err);
  }
};

const deleteOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) return next(new AppError('Notification not found', 404));

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, markRead, markAllRead, deleteOne };