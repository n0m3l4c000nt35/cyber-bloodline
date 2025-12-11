/**
 * Validation utilities for user input
 */

const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

const validateUsername = (username) => {
  // Alphanumeric, underscore, and dash only. Length 3-50
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one letter and one number
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
};

const sanitizeInput = (input) => {
  // Remove leading/trailing whitespace
  return input.trim();
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput
};