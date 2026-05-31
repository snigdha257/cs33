const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getAll, markRead, markAllRead, deleteOne } = require('../controllers/notificationController');

router.get('/',      isAuthenticated, getAll);
router.patch('/read/all', isAuthenticated, markAllRead);
router.patch('/:id/read', isAuthenticated, markRead);
router.delete('/:id',     isAuthenticated, deleteOne);

module.exports = router;