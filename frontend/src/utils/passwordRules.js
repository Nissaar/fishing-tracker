// Mirrors backend/src/utils/passwordPolicy.js, which enforces the same rules
export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8, error: 'Password must be at least 8 characters' },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p), error: 'Password must contain at least one uppercase letter' },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p), error: 'Password must contain at least one lowercase letter' },
  { label: 'One number', test: (p) => /[0-9]/.test(p), error: 'Password must contain at least one number' },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*]/.test(p), error: 'Password must contain at least one special character (!@#$%^&*)' }
];

// The first rule the password breaks, or null
export const passwordProblem = (password) => PASSWORD_RULES.find(rule => !rule.test(password))?.error || null;
