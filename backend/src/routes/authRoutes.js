const express = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const { isGoogleConfigured } = require('../config/passport');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiters');
const { signToken } = require('../utils/token');
const logger = require('../config/logger');

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  [
    body('username').trim().isLength({ min: 3 }),
    // Only trim + lowercase; see utils/email.js for why Gmail dots are kept
    body('email').trim().isEmail().toLowerCase(),
    body('password').isLength({ min: 6 })
  ],
  authController.register
);

router.post('/login', loginLimiter, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

// Google OAuth — only mounted when credentials are configured, otherwise
// passport throws "Unknown authentication strategy" and the route returns 500
if (isGoogleConfigured) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  router.get('/google/callback', (req, res, next) => {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        logger.error(`Google sign-in failed: ${err.message}`);
        return res.redirect(`${loginUrl}?error=google_failed`);
      }
      if (!user) {
        return res.redirect(`${loginUrl}?error=${(info && info.reason) || 'google_failed'}`);
      }
      // Fragment, not query string: browsers never send it to a server, so the
      // token stays out of access logs and Referer headers
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback#token=${signToken(user.id)}`);
    })(req, res, next);
  });
}

module.exports = router;
