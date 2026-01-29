const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
require('dotenv').config();

const logger = require('./config/logger');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const fishingRoutes = require('./routes/fishingRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logsRoutes = require('./routes/logsRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

// Use Winston logger stream for Morgan
app.use(morgan('combined', { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fishing-tracker-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Public routes (no authentication needed)
app.use('/api/public', publicRoutes);
app.use('/api/contact', contactRoutes);

// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/fishing', fishingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});