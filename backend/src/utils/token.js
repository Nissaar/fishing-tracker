const jwt = require('jsonwebtoken');

// jsonwebtoken omits `exp` entirely when expiresIn is undefined, which would
// issue tokens that never expire
const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE || '7d'
});

module.exports = { signToken };
