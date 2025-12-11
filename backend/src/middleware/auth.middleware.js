const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and authenticate requests
 */
const authenticateToken = (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    // 2. Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token is invalid or expired
        return res.status(403).json({
          error: 'Invalid or expired token'
        });
      }

      // 3. Attach user info to request object
      req.user = {
        userId: decoded.userId,
        username: decoded.username
      };

      // 4. Continue to next middleware/route handler
      next();
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional middleware - authenticates if token is present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, but that's okay - continue without user info
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        // Valid token - attach user info
        req.user = {
          userId: decoded.userId,
          username: decoded.username
        };
      }
      // Invalid token - ignore it and continue without user info
      next();
    });

  } catch (error) {
    // Don't fail the request, just continue without auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};