# Lightning in the Air Website

Public pages:
- Home
- The Band
- Shows, featuring past performances
- Media, with embedded YouTube videos and a photo gallery
- Calendar, for upcoming dates
- Booking

The public site reads content from Firebase when configured and falls back to `data/site-content.json` before Firebase is connected. The `/admin/` area is not linked from the public website and is blocked from search indexing.

## Previewing locally

Use VS Code Live Server or another local web server. YouTube embeds require an `http://` or `https://` page. Opening `index.html` directly as a `file://` page will show video posters instead of the embedded players.

See `FIREBASE-SETUP.md` for the future admin and storage connection steps.
