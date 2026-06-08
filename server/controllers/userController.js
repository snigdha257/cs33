const User = require('../models/User');
const FAQ = require('../models/FAQ');
const AppError = require('../utils/AppError');

const getProfile = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;

    const user = await User.findOne({
      $or: [{ _id: idOrUsername }, { username: idOrUsername }],
    }).select('name avatar bio reputation badges createdAt role following followerCount followingCount notifyOnAnswer notifyOnComment');

    if (!user) return next(new AppError('User not found', 404));

    const [faqs, answerCount, acceptedCount] = await Promise.all([
      FAQ.find({ author: user._id }).sort({ createdAt: -1 }).limit(20).select('question tags votes createdAt status isPinned').lean(),
      FAQ.countDocuments({ 'answers.author': user._id, status: 'approved' }),
      FAQ.countDocuments({ 'answers.author': user._id, 'answers.isAccepted': true, status: 'approved' }),
    ]);

    // Check if current user already follows this profile user
    let isFollowing = false;
    if (req.user && !req.user._id.equals(user._id)) {
      isFollowing = req.user.following.some((fid) => fid.equals(user._id));
    }

    return res.json({
      success: true,
      data: {
        ...user.toObject(),
        isFollowing,
        followingCount: user.followingCount || 0,
        followerCount: user.followerCount || 0,
        questionCount: faqs.length,
        answerCount,
        acceptedCount,
        faqs,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user._id.equals(id)) {
      return next(new AppError('Not authorized to update this profile', 403));
    }

    const { name, bio, avatar, notifyOnAnswer, notifyOnComment } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined && avatar !== '') updates.avatar = avatar;
    if (notifyOnAnswer !== undefined) updates.notifyOnAnswer = notifyOnAnswer;
    if (notifyOnComment !== undefined) updates.notifyOnComment = notifyOnComment;

    const user = await User.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true }).select(
      'name avatar bio reputation badges email role notifyOnAnswer notifyOnComment createdAt lastActive'
    );

    return res.json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!req.user._id.equals(id)) {
      return next(new AppError('Not authorized to change this password', 403));
    }

    if (!newPassword || newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 400));
    }

    const user = await User.findById(id).select('+passwordHash');
    if (!user) return next(new AppError('User not found', 404));

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return next(new AppError('Current password is incorrect', 401));

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return next(err);
  }
};

const followUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.equals(id)) {
      return next(new AppError('Cannot follow yourself', 400));
    }

    const targetUser = await User.findById(id);
    if (!targetUser) return next(new AppError('User not found', 404));

    // Conditional atomic update — only matches if NOT already following
    // This avoids the race condition and prevents double-count
    const followingAlready = req.user.following?.some((fid) => fid.equals(id));
    if (followingAlready) {
      return res.json({ success: true, message: 'Already following' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $addToSet: { following: id } }),
      User.findByIdAndUpdate(id,        { $inc:  { followerCount: 1 } }),
    ]);

    return res.json({ success: true, message: 'User followed' });
  } catch (err) {
    return next(err);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) return next(new AppError('User not found', 404));

    if (!req.user.following?.some((fid) => fid.toString() === id)) {
      return next(new AppError('Not following this user', 400));
    }

    // Atomic — $pull removes without needing to re-save full document
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $pull: { following: id } }),
      User.findByIdAndUpdate(id,        { $inc:  { followerCount: -1 } }),
    ]);

    return res.json({ success: true, message: 'User unfollowed' });
  } catch (err) {
    return next(err);
  }
};

const saveFAQ = async (req, res, next) => {
  try {
    const { faqId } = req.params;

    const faq = await FAQ.findById(faqId);
    if (!faq) return next(new AppError('FAQ not found', 404));

    const alreadySaved = req.user.savedFAQs.includes(faqId);

    if (alreadySaved) {
      req.user.savedFAQs = req.user.savedFAQs.filter((id) => !id.equals(faqId));
      await req.user.save();
      return res.json({ success: true, message: 'FAQ removed from saved', saved: false });
    }

    req.user.savedFAQs.push(faqId);
    await req.user.save();
    return res.json({ success: true, message: 'FAQ saved', saved: true });
  } catch (err) {
    return next(err);
  }
};

const getSavedFAQs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ _id: { $in: req.user.savedFAQs }, status: 'approved' })
      .sort({ createdAt: -1 })
      .select('question tags votes createdAt author views answers category isAccepted status')
      .lean();

    // Populate author and category for proper display; skip category if invalid refs exist
    try {
      await FAQ.populate(faqs, [
        { path: 'author', select: 'name avatar' },
        { path: 'category', select: 'name slug color' },
      ]);
    } catch (popErr) {
      // Corrupt category refs in some FAQs — proceed without category population
      console.error('[getSavedFAQs] populate warning:', popErr.message);
    }

    return res.json({ success: true, data: faqs });
  } catch (err) {
    return next(err);
  }
};

const getActivityFeed = async (req, res, next) => {
  try {
    const followingIds = req.user.following;

    if (followingIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const faqs = await FAQ.find({
      author: { $in: followingIds },
      status: 'approved',
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('question votes answerCount category status createdAt')
      .lean()
      .populate('author', 'name avatar');

    return res.json({ success: true, data: faqs });
  } catch (err) {
    return next(err);
  }
};

const getUserAnswers = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const user = await User.findOne({
      $or: [{ _id: idOrUsername }, { username: idOrUsername }],
    }).select('_id');
    if (!user) return next(new AppError('User not found', 404));

    const answers = await FAQ.aggregate([
      { $match: { 'answers.author': user._id, status: 'approved' } },
      { $unwind: '$answers' },
      { $match: { 'answers.author': user._id } },
      { $sort: { 'answers.createdAt': -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: 'answers.author',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, avatar: 1, reputation: 1 } }],
          as: 'answers.authorPop',
        },
      },
      {
        $addFields: {
          'answers.author': { $arrayElemAt: ['$answers.authorPop', 0] },
        },
      },
      {
        $project: {
          _id:            '$answers._id',
          body:           '$answers.body',
          votes:          '$answers.votes',
          isAccepted:     '$answers.isAccepted',
          createdAt:      '$answers.createdAt',
          faq: { _id: '$_id', question: '$question', votes: '$votes', answerCount: { $size: '$answers' } },
          author:         '$answers.author',
        },
      },
    ]);

    return res.json({ success: true, data: answers });
  } catch (err) {
    return next(err);
  }
};

const getUserActivity = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const user = await User.findOne({
      $or: [{ _id: idOrUsername }, { username: idOrUsername }],
    }).select('_id');
    if (!user) return next(new AppError('User not found', 404));

    const [faqs, answers] = await Promise.all([
      FAQ.find({ author: user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('question votes answerCount category status createdAt')
        .lean(),
      FAQ.find({ 'answers.author': user._id, status: 'approved' })
        .sort({ 'answers.createdAt': -1 })
        .limit(20)
        .select('question answers.createdAt answers.author')
        .lean(),
    ]);

    const activity = [
      ...faqs.map((f) => ({
        type: 'faq_created',
        icon: '❓',
        text: 'asked a new question',
        faq: {
          _id: f._id,
          question: f.question,
          votes: f.votes,
          answerCount: f.answerCount,
          category: f.category,
          status: f.status,
        },
        createdAt: f.createdAt,
      })),
      ...answers.flatMap((f) =>
        f.answers
          .filter((a) => a.author.equals(user._id))
          .map((a) => ({
            type: 'answer_added',
            icon: '💬',
            text: 'answered',
            faq: { _id: f._id, question: f.question },
            createdAt: a.createdAt,
          }))
      ),
    ];

    activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, data: activity.slice(0, 30) });
  } catch (err) {
    return next(err);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    // Single aggregation — join with FAQ counts in one DB round-trip (no N+1)
    const topUsers = await User.aggregate([
      { $match: { role: 'user' } },
      { $sort: { reputation: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'faqs',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$author', '$$userId'] }, status: 'approved' } },
            { $count: 'faqCount' },
          ],
          as: 'faqData',
        },
      },
      {
        $addFields: {
          faqCount: { $ifNull: [{ $arrayElemAt: ['$faqData.faqCount', 0] }, 0] },
        },
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          reputation: 1,
          badges: 1,
          faqCount: 1,
        },
      },
    ]);

    return res.json({ success: true, data: topUsers });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  followUser,
  unfollowUser,
  saveFAQ,
  getSavedFAQs,
  getActivityFeed,
  getUserActivity,
  getUserAnswers,
  getLeaderboard,
};