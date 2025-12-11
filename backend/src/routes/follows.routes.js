const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowingFeed,
  checkFollowing
} = require('../controllers/follows.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Follow/unfollow
router.post('/:username', followUser);
router.delete('/:username', unfollowUser);

// Lists
router.get('/list/following', getFollowing);
router.get('/list/followers', getFollowers);

// Feed
router.get('/feed', getFollowingFeed);

// Check follow status
router.get('/check/:username', checkFollowing);

module.exports = router;