const pool = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const { userId } = req.user;

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

const getFeed = async (req, res) => {
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
    console.error('Get feed error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching feed'
    });
  }
};

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

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

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