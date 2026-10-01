// Same rules the register form shows (frontend/src/utils/passwordRules.js).
// Returns the first rule the password breaks, or null.
const RULES = [
  [(p) => p.length >= 8, 'Password must be at least 8 characters'],
  [(p) => p.length <= 72, 'Password must be at most 72 characters'],
  [(p) => /[A-Z]/.test(p), 'Password must contain at least one uppercase letter'],
  [(p) => /[a-z]/.test(p), 'Password must contain at least one lowercase letter'],
  [(p) => /[0-9]/.test(p), 'Password must contain at least one number'],
  [(p) => /[!@#$%^&*]/.test(p), 'Password must contain at least one special character (!@#$%^&*)']
];

const passwordProblem = (password) => {
  if (typeof password !== 'string') return 'Password is required';
  const broken = RULES.find(([ok]) => !ok(password));
  return broken ? broken[1] : null;
};

module.exports = { passwordProblem };
