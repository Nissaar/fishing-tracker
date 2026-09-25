// Emails are compared and stored lowercase and trimmed, everywhere.
const normalizeEmail = (email) => String(email).trim().toLowerCase();

// Registration used to strip dots from Gmail addresses, so accounts created
// before that was dropped are stored as e.g. johnsmith@gmail.com. Gmail
// ignores dots, so both spellings are the same mailbox.
const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];

const emailLookupCandidates = (email) => {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split('@');
  if (GMAIL_DOMAINS.includes(domain) && local.includes('.')) {
    return [normalized, `${local.replace(/\./g, '')}@${domain}`];
  }
  return [normalized];
};

module.exports = { normalizeEmail, emailLookupCandidates };
