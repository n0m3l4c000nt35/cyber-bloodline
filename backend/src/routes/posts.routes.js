const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getPost,
  deletePost
} = require('../controllers/posts.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

// Public route - anyone can view feed
router.get('/', optionalAuth, getFeed);
router.get('/:id', optionalAuth, getPost);

// Protected routes - require authentication
router.post('/', authenticateToken, createPost);
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;