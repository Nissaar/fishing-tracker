add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
# TLS is terminated by Traefik; browsers only honour this over HTTPS
add_header Strict-Transport-Security "max-age=31536000" always;
# Report-only for now: violations show in the browser console without
# blocking anything. Switch the header name to Content-Security-Policy once
# the console stays clean in production.
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" always;
