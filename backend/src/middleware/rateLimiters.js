const rateLimit = require('express-rate-limit');

// The e2e suite logs in hundreds of times from one IP; limits would make it fail
const skipInTests = () => process.env.NODE_ENV === 'test';

// Requests reach the API through Cloudflare, Traefik and nginx, so req.ip is
// one of those proxies and every visitor would share one budget. Cloudflare
// puts the visitor's address in CF-Connecting-IP.
const clientIp = (req) => req.get('cf-connecting-ip') || req.ip;

const limiter = (options) => rateLimit({
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTests,
  keyGenerator: clientIp,
  message: { error: 'Too many requests, please try again later' },
  ...options
});

// Keyed by user for authenticated routes so people sharing an IP (mobile
// carriers, family wifi) don't eat into each other's budget
const byUser = (req) => `user:${req.user.id}`;

// Failed attempts only, so a user who logs in normally is never blocked
const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again in 15 minutes' }
});

const registerLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 5
});

// Every submission sends a paid Mailgun email
const contactLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many messages, please try again later' }
});

const logCreateLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: byUser
});

// Each conditions lookup fans out to several Open-Meteo calls on a free quota
const conditionsLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  keyGenerator: byUser
});

const publicConditionsLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 120
});

module.exports = {
  clientIp,
  loginLimiter,
  registerLimiter,
  contactLimiter,
  logCreateLimiter,
  conditionsLimiter,
  publicConditionsLimiter
};
