const express = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  authController.register
);

router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;