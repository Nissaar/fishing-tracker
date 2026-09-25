const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

// Reasons a Google sign-in is refused; the auth route maps these to a
// ?error= code on the login page
const GOOGLE_LOGIN_REFUSED = {
  UNVERIFIED_EMAIL: 'google_unverified',
  PASSWORD_ACCOUNT: 'use_password'
};

const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// One account per email, and each account keeps the sign-in method it was
// created with. Matching on email alone would let someone who registered a
// victim's address with a password read everything the victim later logs
// through Google.
async function findOrCreateGoogleUser(profile) {
  const googleEmail = profile.emails && profile.emails[0];
  if (!googleEmail) {
    throw new Error('No email provided by Google');
  }
  if (googleEmail.verified === false) {
    return { refused: GOOGLE_LOGIN_REFUSED.UNVERIFIED_EMAIL };
  }

  const email = googleEmail.value.trim().toLowerCase();

  const byGoogleId = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
  if (byGoogleId.rows.length > 0) {
    return { user: byGoogleId.rows[0] };
  }

  const byEmail = await pool.query('SELECT * FROM users WHERE lower(email) = $1', [email]);
  if (byEmail.rows.length > 0) {
    const existing = byEmail.rows[0];
    // A different Google identity, or an account that signs in with a password
    if (existing.google_id || existing.password_hash) {
      return { refused: GOOGLE_LOGIN_REFUSED.PASSWORD_ACCOUNT };
    }
    // No password and no Google id: nothing to take over, so link it
    const linked = await pool.query(
      'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
      [profile.id, existing.id]
    );
    return { user: linked.rows[0] };
  }

  const created = await pool.query(
    'INSERT INTO users (username, email, password_hash, google_id, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [
      profile.displayName || email.split('@')[0],
      email,
      '',
      profile.id,
      profile.photos && profile.photos[0] ? profile.photos[0].value : null
    ]
  );
  return { user: created.rows[0] };
}

if (isGoogleConfigured) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      // Ties the callback to the browser that started the sign-in, so an
      // attacker can't log a victim into the attacker's account
      state: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { user, refused } = await findOrCreateGoogleUser(profile);
        if (refused) {
          return done(null, false, { reason: refused });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

module.exports = passport;
module.exports.isGoogleConfigured = isGoogleConfigured;
