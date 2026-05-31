const express = require('express');
const router = express.Router();
const { isAuthenticated, optionalAuth } = require('../middleware/auth');
const {
  updateProfileRules,
  changePasswordRules,
} = require('../middleware/validators');
const {
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
} = require('../controllers/userController');

// Saved FAQs (must be before /:idOrUsername to avoid wildcard match)
router.post('/saved/:faqId',  isAuthenticated, saveFAQ);
router.get('/saved', isAuthenticated, getSavedFAQs);

// Auth-gated profile & password
router.put('/:id/profile',   isAuthenticated, updateProfileRules, updateProfile);
router.put('/:id/password',  isAuthenticated, changePasswordRules, changePassword);

// Follow / unfollow
router.post('/:id/follow',    isAuthenticated, followUser);
router.delete('/:id/follow',  isAuthenticated, unfollowUser);

// Public read
router.get('/leaderboard', (req, res, next) => { getLeaderboard(req, res, next); });
router.get('/:idOrUsername', optionalAuth, getProfile);

// Activity & content
router.get('/feed/activity',             isAuthenticated, getActivityFeed);
router.get('/leaderboard', (req, res, next) => { console.log('[ROUTE] /leaderboard hit'); getLeaderboard(req, res, next); });
router.get('/:idOrUsername/activity',    getUserActivity);
router.get('/:idOrUsername/answers',     getUserAnswers);

module.exports = router;