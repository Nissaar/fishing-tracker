const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const logger = require('./config/logger');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const fishingRoutes = require('./routes/fishingRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logsRoutes = require('./routes/logsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const { runMigrations } = require('./config/migrate');

const app = express();
const PORT = process.env.PORT || 5000;

// One proxy hop (Traefik) sits in front of the API. Without this, rate limits
// see every visitor as the proxy's IP and secure session cookies are never set.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  // env.js refuses to start in production without CORS_ORIGIN
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

// Use Winston logger stream for Morgan
app.use(morgan('combined', { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only used to hold the OAuth `state` value during Google sign-in; API auth is
// by JWT. MemoryStore is fine for the single backend instance this runs as.
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // long enough to finish a Google sign-in
  }
}));

app.use(passport.initialize());

// Public routes (no authentication needed)
app.use('/api/public', publicRoutes);
app.use('/api/contact', contactRoutes);

// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/fishing', fishingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/events', eventsRoutes);

const pool = require('./config/database');

app.get('/health', async (req, res) => {
  try {
    // Verify database connectivity
    await pool.query('SELECT 1');
    res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error) {
    logger.error('Health check failed:', error.message);
    res.status(503).json({ status: 'ERROR', timestamp: new Date().toISOString(), database: 'disconnected' });
  }
});

app.use((err, req, res, next) => {
  logger.error(`${err.message}`, { 
    stack: err.stack, 
    url: req.url, 
    method: req.method,
    ip: req.ip
  });
  res.status(500).json({ error: 'Something went wrong!' });
});

// Apply pending database migrations, then start the server.
// A migration failure is logged but does not stop the API from serving.
runMigrations()
  .catch((err) => logger.error(`Database migration failed: ${err.message}`, { stack: err.stack }));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (err) => {
  logger.error(`Server error: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});