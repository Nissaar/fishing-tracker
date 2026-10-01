const jwt = require('jsonwebtoken');

// Takes the user row rather than an id so every caller passes token_version;
// a token signed without it would be rejected once the password has changed.
// jsonwebtoken omits `exp` entirely when expiresIn is undefined, which would
// issue tokens that never expire.
const signToken = (user) => jwt.sign(
  { userId: user.id, tokenVersion: user.token_version || 0 },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

module.exports = { signToken };
