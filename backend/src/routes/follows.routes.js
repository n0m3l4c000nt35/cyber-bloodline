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

router.use(authenticateToken);

router.post('/:username', followUser);
router.delete('/:username', unfollowUser);

router.get('/list/following', getFollowing);
router.get('/list/followers', getFollowers);

router.get('/feed', getFollowingFeed);

router.get('/check/:username', checkFollowing);

module.exports = router;