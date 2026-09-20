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

## Facebook page

The page is wired into the app already:

```
https://www.facebook.com/people/nulapessapp/61577446590617/
```

It is the default in `frontend/src/utils/shareText.js` and powers the **Facebook**
link in the site footer and the **Ouver mo paz** button in the admin share tool.
To point it somewhere else, set `REACT_APP_FACEBOOK_PAGE_URL` in `frontend/.env`
— no code change needed.

## Posting the weekly leaderboard

1. Sign in as admin → **Top Anglers** tab.
2. Pick **This week** or **This month**.
3. Untick *"Azout blok nouvo fonksion"* once the new features stop being news.
4. **Kopie teks** → **Ouver mo paz** → paste.

The wording is fixed; only the names and numbers change from week to week.
