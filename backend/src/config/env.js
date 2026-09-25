// Startup checks for secrets and settings the API cannot run safely without.
// Runs before anything else so a misconfigured deploy fails loudly at boot.

// Sample values that were once published in domain.md — anyone could forge
// tokens signed with them
const PUBLISHED_SAMPLE_SECRETS = [
  'K8h3nP9mR2vL5sJ7wQ1xZ4tY6uF0aE3g',
  'M2nB7kL9pR4vX8wS3tF6yQ1zA5eH0jC2'
];

const MIN_SECRET_LENGTH = 32;

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  const checkSecret = (name) => {
    const value = (process.env[name] || '').trim();
    if (!value) {
      return `${name} is not set`;
    }
    if (PUBLISHED_SAMPLE_SECRETS.includes(value)) {
      return `${name} uses the sample value from domain.md; generate a new one with: openssl rand -base64 32`;
    }
    if (value.length < MIN_SECRET_LENGTH) {
      return `${name} must be at least ${MIN_SECRET_LENGTH} characters`;
    }
    return null;
  };

  for (const name of ['JWT_SECRET', 'SESSION_SECRET']) {
    const problem = checkSecret(name);
    // Without JWT_SECRET, register creates the user and then fails to sign a
    // token, so it is required in every environment
    const required = isProduction || (name === 'JWT_SECRET' && !(process.env.JWT_SECRET || '').trim());
    if (problem) {
      (required ? errors : warnings).push(problem);
    }
  }

  // Without it CORS falls back to allowing every origin
  if (!process.env.CORS_ORIGIN) {
    (isProduction ? errors : warnings).push('CORS_ORIGIN is not set');
  }

  for (const warning of warnings) {
    console.warn(`WARNING: ${warning} (allowed outside production only)`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`FATAL ERROR: ${error}`);
    }
    process.exit(1);
  }
}

module.exports = { validateEnv };
