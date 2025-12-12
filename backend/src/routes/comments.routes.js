const express = require('express');
const router = express.Router();
const {
  createComment,
  getPostComments,
  getComment,
  deleteComment
} = require('../controllers/comments.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

router.get('/post/:postId', optionalAuth, getPostComments);
router.get('/:id', optionalAuth, getComment);

router.post('/post/:postId', authenticateToken, createComment);
router.delete('/:id', authenticateToken, deleteComment);

module.exports = router;