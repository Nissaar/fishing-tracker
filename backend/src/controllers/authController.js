const User = require('../models/User');
const { validationResult } = require('express-validator');
const { signToken: generateToken } = require('../utils/token');
const { passwordProblem } = require('../utils/passwordPolicy');
const { normalizeEmail } = require('../utils/email');
const logger = require('../config/logger');

// token_version is internal to session revocation
const publicUser = ({ token_version, ...user }) => user;

// 400 rather than 401: the API client treats any 401 as an expired session
// and sends the user to the login page
const WRONG_PASSWORD = { error: 'Current password is incorrect' };

const checkCurrentPassword = async (userId, password) => {
  const hash = await User.getPasswordHash(userId);
  return Boolean(hash) && typeof password === 'string' && User.verifyPassword(password, hash);
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const user = await User.create(username, email, password);
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: false,
        has_password: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findByEmail(email);
    // Security note: We intentionally return a generic "Invalid credentials" message
    // when no user is found, to avoid revealing whether an email is registered and
    // reduce the risk of account enumeration. This trades off some UX for security.
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Accounts created with Google only ever sign in with Google
    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please continue with Google.' });
    }
    
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        // Included so admin-only UI appears immediately after login instead of
        // only after the next profile refresh
        is_admin: user.is_admin === true,
        // Password sign-in, so there is one; the profile page relies on this
        has_password: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const current = req.user;
    const { currentPassword } = req.body;
    const username = req.body.username !== undefined && req.body.username !== current.username
      ? req.body.username
      : undefined;
    const email = req.body.email !== undefined && normalizeEmail(req.body.email) !== normalizeEmail(current.email)
      ? req.body.email
      : undefined;

    if (username === undefined && email === undefined) {
      return res.json({ message: 'Nothing to update', user: publicUser(current) });
    }

    if (email !== undefined) {
      // Google sign-in looks accounts up by Google id, but the address shown
      // should stay the one Google vouches for
      if (!current.has_password) {
        return res.status(400).json({ error: 'This account signs in with Google, so its email comes from Google' });
      }
      // A borrowed session shouldn't be enough to move the account elsewhere
      if (!(await checkCurrentPassword(current.id, currentPassword))) {
        return res.status(400).json(WRONG_PASSWORD);
      }
      const owner = await User.findByEmail(email);
      if (owner && owner.id !== current.id) {
        return res.status(409).json({ error: 'That email is already used by another account' });
      }
    }

    if (username !== undefined && await User.isUsernameTaken(username, current.id)) {
      return res.status(409).json({ error: 'That username is already taken' });
    }

    const user = await User.updateProfile(current.id, { username, email });
    logger.info(`User ${current.id} updated their profile (${[username !== undefined && 'username', email !== undefined && 'email'].filter(Boolean).join(', ')})`);
    res.json({ message: 'Profile updated', user: publicUser(user) });
  } catch (error) {
    // Lost a race with another account taking the same username or email
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That username or email is already taken' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user.has_password) {
      return res.status(400).json({ error: 'This account signs in with Google and has no password to change' });
    }
    if (!(await checkCurrentPassword(req.user.id, currentPassword))) {
      return res.status(400).json(WRONG_PASSWORD);
    }
    const problem = passwordProblem(newPassword);
    if (problem) {
      return res.status(400).json({ error: problem });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'New password must be different from the current one' });
    }

    const updated = await User.updatePassword(req.user.id, newPassword);
    logger.info(`User ${req.user.id} changed their password`);
    // Every other session is now signed out; this one continues with a new token
    res.json({ message: 'Password changed', token: generateToken(updated) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};