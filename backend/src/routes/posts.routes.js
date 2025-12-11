const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getPost,
  deletePost
} = require('../controllers/posts.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, getFeed);
router.get('/:id', optionalAuth, getPost);

router.post('/', authenticateToken, createPost);
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;