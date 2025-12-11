const pool = require('../config/database');

/**
 * Follow a user
 */
const followUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { userId } = req.user; // Current logged-in user

    // Get the user to follow
    const userQuery = 'SELECT id, username FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const followingId = userResult.rows[0].id;

    // Check if trying to follow yourself
    if (followingId === userId) {
      return res.status(400).json({
        error: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const checkQuery = `
      SELECT * FROM follows 
      WHERE follower_id = $1 AND following_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, followingId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error: `You are already following ${username}`
      });
    }

    // Create follow relationship
    const insertQuery = `
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      RETURNING created_at
    `;
    const result = await pool.query(insertQuery, [userId, followingId]);

    res.status(201).json({
      message: `You are now following ${username}`,
      follow: {
        username,
        followedAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      error: 'Internal server error while following user'
    });
  }
};

/**
 * Unfollow a user
 */
const unfollowUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { userId } = req.user;

    // Get the user to unfollow
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const followingId = userResult.rows[0].id;

    // Check if actually following
    const checkQuery = `
      SELECT * FROM follows 
      WHERE follower_id = $1 AND following_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, followingId]);

    if (checkResult.rows.length === 0) {
      return res.status(400).json({
        error: `You are not following ${username}`
      });
    }

    // Delete follow relationship
    const deleteQuery = `
      DELETE FROM follows 
      WHERE follower_id = $1 AND following_id = $2
    `;
    await pool.query(deleteQuery, [userId, followingId]);

    res.status(200).json({
      message: `You unfollowed ${username}`
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      error: 'Internal server error while unfollowing user'
    });
  }
};

/**
 * Get list of users that current user is following
 */
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.user;

    const query = `
      SELECT 
        u.id,
        u.username,
        u.public_profile,
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      following: result.rows.map(row => ({
        userId: row.id,
        username: row.username,
        publicProfile: row.public_profile,
        followedAt: row.followed_at
      })),
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching following list'
    });
  }
};

/**
 * Get list of users following the current user
 */
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.user;

    const query = `
      SELECT 
        u.id,
        u.username,
        u.public_profile,
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      followers: result.rows.map(row => ({
        userId: row.id,
        username: row.username,
        publicProfile: row.public_profile,
        followedAt: row.followed_at
      })),
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching followers list'
    });
  }
};

/**
 * Get personalized feed (posts from followed users only)
 */
const getFollowingFeed = async (req, res) => {
  try {
    const { userId } = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    // Get posts only from users that current user follows
    const query = `
      SELECT 
        p.id,
        p.content,
        p.created_at,
        p.user_id,
        u.username
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id IN (
        SELECT following_id 
        FROM follows 
        WHERE follower_id = $1
      )
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    // Get total count of posts from followed users
    const countQuery = `
      SELECT COUNT(*) 
      FROM posts 
      WHERE user_id IN (
        SELECT following_id 
        FROM follows 
        WHERE follower_id = $1
      )
    `;
    const countResult = await pool.query(countQuery, [userId]);
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
    console.error('Get following feed error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching following feed'
    });
  }
};

/**
 * Check if current user follows another user
 */
const checkFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const { userId } = req.user;

    // Get the target user
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const targetUserId = userResult.rows[0].id;

    // Check if following
    const checkQuery = `
      SELECT * FROM follows 
      WHERE follower_id = $1 AND following_id = $2
    `;
    const result = await pool.query(checkQuery, [userId, targetUserId]);

    res.status(200).json({
      isFollowing: result.rows.length > 0,
      username
    });

  } catch (error) {
    console.error('Check following error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowingFeed,
  checkFollowing
};