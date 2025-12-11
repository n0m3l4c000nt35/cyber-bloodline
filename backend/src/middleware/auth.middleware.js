const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid or expired token'
        });
      }

      req.user = {
        userId: decoded.userId,
        username: decoded.username
      };

      next();
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = {
          userId: decoded.userId,
          username: decoded.username
        };
      }
      next();
    });

  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};