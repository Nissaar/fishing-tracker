const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
      
      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }
      
      // Create new user
      const newUser = await pool.query(
        'INSERT INTO users (username, email, password_hash, google_id, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          profile.displayName,
          profile.emails[0].value,
          '',
          profile.id,
          profile.photos[0]?.value || null
        ]
      );
      
      return done(null, newUser.rows[0]);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;