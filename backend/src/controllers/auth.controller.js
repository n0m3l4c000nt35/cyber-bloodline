const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput
} = require('../utils/validation');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['username', 'email', 'password']
      });
    }

    // 2. Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // 3. Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // 4. Validate username format
    if (!validateUsername(sanitizedUsername)) {
      return res.status(400).json({
        error: 'Invalid username format. Use 3-50 alphanumeric characters, underscores, or dashes only'
      });
    }

    // 5. Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.message
      });
    }

    // 6. Check if username or email already exists
    const checkQuery = `
      SELECT id FROM users 
      WHERE username = $1 OR email = $2
    `;
    const existingUser = await pool.query(checkQuery, [sanitizedUsername, sanitizedEmail]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Username or email already exists'
      });
    }

    // 7. Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 8. Insert new user
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, public_profile, private_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, created_at
    `;

    const defaultPublicProfile = {};
    const defaultPrivateData = {};

    const result = await pool.query(insertQuery, [
      sanitizedUsername,
      sanitizedEmail,
      passwordHash,
      defaultPublicProfile,
      defaultPrivateData
    ]);

    const newUser = result.rows[0];

    // 9. Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 10. Return success response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
};

/**
 * Login an existing user
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['username', 'password']
      });
    }

    // 2. Sanitize input
    const sanitizedUsername = sanitizeInput(username);

    // 3. Find user by username
    const query = `
      SELECT id, username, email, password_hash, created_at
      FROM users
      WHERE username = $1
    `;

    const result = await pool.query(query, [sanitizedUsername]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 6. Return success response
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
};

/**
 * Get current user profile (protected route)
 */
const getProfile = async (req, res) => {
  try {
    // req.user is attached by authenticateToken middleware
    const { userId } = req.user;

    const query = `
      SELECT id, username, email, public_profile, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        publicProfile: user.public_profile,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile
};