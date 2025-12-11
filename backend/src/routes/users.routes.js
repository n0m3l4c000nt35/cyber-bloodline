const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getUserProfile,
  getUserPosts,
  getAllUsers
} = require('../controllers/users.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// All routes use optionalAuth (work with or without login)
router.get('/search', optionalAuth, searchUsers);
router.get('/list', optionalAuth, getAllUsers);
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/posts', optionalAuth, getUserPosts);

module.exports = router;