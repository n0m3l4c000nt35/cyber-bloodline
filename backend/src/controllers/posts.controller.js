const pool = require('../config/database');

/**
 * Create a new post
 */
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const { userId } = req.user; // From auth middleware

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({
        error: 'Post content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        error: 'Post content must be 1000 characters or less'
      });
    }

    // Insert post
    const query = `
      INSERT INTO posts (user_id, content)
      VALUES ($1, $2)
      RETURNING id, user_id, content, created_at
    `;

    const result = await pool.query(query, [userId, content.trim()]);
    const post = result.rows[0];

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        createdAt: post.created_at
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      error: 'Internal server error while creating post'
    });
  }
};

/**
 * Get feed (all posts with pagination)
 */
const getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Validate pagination params
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    // Get posts from view (includes user data)
    const query = `
      SELECT 
        id,
        content,
        created_at,
        user_id,
        username
      FROM posts_with_users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    // Get total count for pagination info
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
        }
      })),
      pagination: {
        limit,
        offset,
        total: totalPosts,
        hasMore: offset + limit < totalPosts
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching feed'
    });
  }
};

/**
 * Get a single post by ID
 */
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        content,
        created_at,
        user_id,
        username
      FROM posts_with_users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const post = result.rows[0];

    res.status(200).json({
      post: {
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        author: {
          userId: post.user_id,
          username: post.username
        }
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching post'
    });
  }
};

/**
 * Delete a post (only by author)
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // Check if post exists and belongs to user
    const checkQuery = 'SELECT user_id FROM posts WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'You can only delete your own posts'
      });
    }

    // Delete the post
    const deleteQuery = 'DELETE FROM posts WHERE id = $1';
    await pool.query(deleteQuery, [id]);

    res.status(200).json({
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting post'
    });
  }
};

module.exports = {
  createPost,
  getFeed,
  getPost,
  deletePost
};