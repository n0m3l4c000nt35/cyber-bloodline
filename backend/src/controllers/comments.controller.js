const pool = require('../config/database');

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const { userId } = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: 'Comment content is required'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        error: 'Comment must be 500 characters or less'
      });
    }

    const postCheck = 'SELECT id FROM posts WHERE id = $1';
    const postResult = await pool.query(postCheck, [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const query = `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, post_id, user_id, content, created_at
    `;

    const result = await pool.query(query, [postId, userId, content.trim()]);
    const comment = result.rows[0];

    res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: 'Internal server error while creating comment'
    });
  }
};

const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    const postCheck = 'SELECT id FROM posts WHERE id = $1';
    const postResult = await pool.query(postCheck, [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const query = `
      SELECT 
        id,
        post_id,
        content,
        created_at,
        user_id,
        username
      FROM comments_with_users
      WHERE post_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [postId, limit, offset]);

    const countQuery = 'SELECT COUNT(*) FROM comments WHERE post_id = $1';
    const countResult = await pool.query(countQuery, [postId]);
    const totalComments = parseInt(countResult.rows[0].count);

    res.status(200).json({
      comments: result.rows.map(comment => ({
        id: comment.id,
        postId: comment.post_id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          userId: comment.user_id,
          username: comment.username
        }
      })),
      pagination: {
        limit,
        offset,
        total: totalComments,
        hasMore: offset + limit < totalComments
      }
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching comments'
    });
  }
};

const getComment = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        post_id,
        content,
        created_at,
        user_id,
        username
      FROM comments_with_users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    const comment = result.rows[0];

    res.status(200).json({
      comment: {
        id: comment.id,
        postId: comment.post_id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          userId: comment.user_id,
          username: comment.username
        }
      }
    });

  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching comment'
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const checkQuery = 'SELECT user_id FROM comments WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'You can only delete your own comments'
      });
    }

    const deleteQuery = 'DELETE FROM comments WHERE id = $1';
    await pool.query(deleteQuery, [id]);

    res.status(200).json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting comment'
    });
  }
};

const getPostsWithCommentCounts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    const query = `
      SELECT 
        p.id,
        p.content,
        p.created_at,
        p.user_id,
        u.username,
        COALESCE(COUNT(c.id), 0) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, p.content, p.created_at, p.user_id, u.username
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    const countQuery = 'SELECT COUNT(*) FROM posts';
    const countResult = await pool.query(countQuery);
    const totalPosts = parseInt(countResult.rows[0].count);

    res.status(200).json({
      posts: result.rows.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        author: {
          userId: post.user_id,
          username: post.username
        },
        commentCount: parseInt(post.comment_count)
      })),
      pagination: {
        limit,
        offset,
        total: totalPosts,
        hasMore: offset + limit < totalPosts
      }
    });

  } catch (error) {
    console.error('Get posts with comment counts error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createComment,
  getPostComments,
  getComment,
  deleteComment,
  getPostsWithCommentCounts
};