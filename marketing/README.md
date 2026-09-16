# Marketing assets

Images for the Facebook page, generated from `generate-images.py`
(`python3 generate-images.py` — needs ImageMagick's `convert`).

| File | Size | Use |
|------|------|-----|
| `01-profile-picture.png` | 1080×1080 | Facebook page profile picture. Content sits inside a circle, so the circular crop keeps everything. |
| `02-cover-photo.png` | 1640×924 | Facebook page cover photo. Text is centred to survive the mobile crop. |
| `03-post-new-features.png` | 1200×1200 | Post image for the main "3 new features" announcement. |
| `04-post-leaderboard.png` | 1200×1200 | Post image for the weekly/monthly Top 5. |
| `05-post-events.png` | 1200×1200 | Post image for the fishing events feature. |
| `06-link-preview.png` | 1200×630 | Wide banner for link posts. |

Post copy is in `facebook-post.md`.

## Finding your Facebook page URL

Open your page on a desktop browser and look at the address bar. It is one of:

- `https://www.facebook.com/YourPageName` — if the page has a username
- `https://www.facebook.com/profile.php?id=1000123456789` — if it does not

Either form works. On the mobile app: open the page → **⋯** (three dots) →
**Share** → **Copy link**.

To give the page a short username: **Page settings → Page setup → Username**.

Once you have it, set `REACT_APP_FACEBOOK_PAGE_URL` in `frontend/.env` if you
later want a "Follow our page" link wired into the site.
