const pool = require('../config/database');

/**
 * Search users by username (partial match)
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }

    const searchQuery = `
      SELECT 
        u.id,
        u.username,
        u.public_profile,
        u.created_at,
        COUNT(DISTINCT f1.follower_id) as follower_count,
        COUNT(DISTINCT f2.following_id) as following_count,
        COUNT(DISTINCT p.id) as post_count
      FROM users u
      LEFT JOIN follows f1 ON u.id = f1.following_id
      LEFT JOIN follows f2 ON u.id = f2.follower_id
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE LOWER(u.username) LIKE LOWER($1)
      GROUP BY u.id, u.username, u.public_profile, u.created_at
      ORDER BY u.username
      LIMIT 20
    `;

    const result = await pool.query(searchQuery, [`%${query}%`]);

    res.status(200).json({
      users: result.rows.map(row => ({
        userId: row.id,
        username: row.username,
        publicProfile: row.public_profile,
        createdAt: row.created_at,
        stats: {
          followers: parseInt(row.follower_count),
          following: parseInt(row.following_count),
          posts: parseInt(row.post_count)
        }
      })),
      count: result.rows.length
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Internal server error while searching users'
    });
  }
};

/**
 * Get a user's public profile by username
 */
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.userId; // Optional - may not be logged in

    // Get user info with stats
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.public_profile,
        u.created_at,
        COUNT(DISTINCT f1.follower_id) as follower_count,
        COUNT(DISTINCT f2.following_id) as following_count,
        COUNT(DISTINCT p.id) as post_count
      FROM users u
      LEFT JOIN follows f1 ON u.id = f1.following_id
      LEFT JOIN follows f2 ON u.id = f2.follower_id
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE u.username = $1
      GROUP BY u.id, u.username, u.public_profile, u.created_at
    `;

    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Check if current user follows this user (if logged in)
    let isFollowing = false;
    if (currentUserId) {
      const followQuery = `
        SELECT * FROM follows 
        WHERE follower_id = $1 AND following_id = $2
      `;
      const followResult = await pool.query(followQuery, [currentUserId, user.id]);
      isFollowing = followResult.rows.length > 0;
    }

    res.status(200).json({
      user: {
        userId: user.id,
        username: user.username,
        publicProfile: user.public_profile,
        createdAt: user.created_at,
        stats: {
          followers: parseInt(user.follower_count),
          following: parseInt(user.following_count),
          posts: parseInt(user.post_count)
        },
        ...(currentUserId && { isFollowing })
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching user profile'
    });
  }
};

/**
 * Get a user's posts by username
 */
const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    // Check if user exists
    const userQuery = 'SELECT id, username FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user's posts
    const postsQuery = `
      SELECT 
        id,
        content,
        created_at
      FROM posts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const postsResult = await pool.query(postsQuery, [user.id, limit, offset]);

    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM posts WHERE user_id = $1';
    const countResult = await pool.query(countQuery, [user.id]);
    const totalPosts = parseInt(countResult.rows[0].count);

    res.status(200).json({
      posts: postsResult.rows.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        author: {
          userId: user.id,
          username: user.username
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
    console.error('Get user posts error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching user posts'
    });
  }
};

/**
 * Get list of all users (for discovery)
 */
const getAllUsers = async (req, res) => {
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
        u.id,
        u.username,
        u.public_profile,
        u.created_at,
        COUNT(DISTINCT f1.follower_id) as follower_count,
        COUNT(DISTINCT p.id) as post_count
      FROM users u
      LEFT JOIN follows f1 ON u.id = f1.following_id
      LEFT JOIN posts p ON u.id = p.user_id
      GROUP BY u.id, u.username, u.public_profile, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM users';
    const countResult = await pool.query(countQuery);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.status(200).json({
      users: result.rows.map(row => ({
        userId: row.id,
        username: row.username,
        publicProfile: row.public_profile,
        createdAt: row.created_at,
        stats: {
          followers: parseInt(row.follower_count),
          posts: parseInt(row.post_count)
        }
      })),
      pagination: {
        limit,
        offset,
        total: totalUsers,
        hasMore: offset + limit < totalUsers
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching users'
    });
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  getUserPosts,
  getAllUsers
};